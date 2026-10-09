using System.Globalization;
using System.Text.Json;

namespace ADF247.Api.Services;

public sealed class PlaAlfaService(IWebHostEnvironment environment, IHttpClientFactory clients)
{
    private const string TodayUrl = "https://services7.arcgis.com/ZCqVt1fRXwwK6GF4/ArcGIS/rest/services/Pla_Alfa_Municipal_Avui_FL_alternatiu_VW/FeatureServer/0/query";
    private const string TomorrowUrl = "https://services7.arcgis.com/ZCqVt1fRXwwK6GF4/ArcGIS/rest/services/pla_alfa_municipal_dema_FL_VW/FeatureServer/5/query";
    private string SelectionPath => Path.Combine(environment.ContentRootPath, "pla-alfa-municipalities.json");
    private static readonly Dictionary<string, Cache> StatusCache = [];
    public async Task<object> CatalogAsync()
    {
        var selected = Read();
        var payload = await GetJsonAsync(TodayUrl + "?f=pjson&where=1%3D1&outFields=NOMMUNI%2CNOMCOMAR%2COBJECTID&returnGeometry=false");
        var values = Features(payload).Select(feature => new { municipality = GetString(feature, "NOMMUNI"), comarca = GetString(feature, "NOMCOMAR"), objectId = GetInt(feature, "OBJECTID") }).Where(item => item.municipality is not null).OrderBy(item => item.municipality).Select(item => new { item.municipality, item.comarca, item.objectId, selected = selected.Municipalities.Contains(item.municipality!, StringComparer.OrdinalIgnoreCase) });
        return new { updatedAt = DateTime.UtcNow, selectedMunicipalities = selected.Municipalities, principalMunicipality = selected.PrincipalMunicipality, municipalities = values };
    }
    public object Update(IReadOnlyList<string>? municipalities, string? principal)
    {
        if (municipalities is null) throw new ArgumentException("El campo \"municipalities\" debe ser un array de strings.");
        var list = municipalities.Where(value => !string.IsNullOrWhiteSpace(value)).Select(value => value.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(value => value, StringComparer.CurrentCulture).ToList();
        var selected = new Selection(list, !string.IsNullOrWhiteSpace(principal) && list.Contains(principal.Trim(), StringComparer.OrdinalIgnoreCase) ? principal.Trim() : null);
        File.WriteAllText(SelectionPath, JsonSerializer.Serialize(selected, new JsonSerializerOptions { WriteIndented = true }));
        return new { updatedAt = DateTime.UtcNow, municipalities = selected.Municipalities, principalMunicipality = selected.PrincipalMunicipality };
    }
    public async Task<object> StatusAsync(bool forceRefresh)
    {
        var selected = Read();
        var key = string.Join('|', selected.Municipalities);
        if (!forceRefresh && StatusCache.TryGetValue(key, out var cached) && DateTime.UtcNow - cached.CreatedAt < TimeSpan.FromHours(1)) return cached.Payload;
        var warnings = new List<object>();
        var today = await QueryAsync(TodayUrl, "OBJECTID", selected.Municipalities, warnings, "today");
        var tomorrow = await QueryAsync(TomorrowUrl, "FID", selected.Municipalities, warnings, "tomorrow");
        var forecasts = await ForecastAsync(selected.Municipalities, warnings);
        var todayIso = DateTime.Now.ToString("yyyy-MM-dd");
        var tomorrowIso = DateTime.Now.AddDays(1).ToString("yyyy-MM-dd");
        var rows = selected.Municipalities.Select(name =>
        {
            today.TryGetValue(Normalize(name), out var now); tomorrow.TryGetValue(Normalize(name), out var next);
            forecasts.TryGetValue(Normalize(name), out var weather);
            object? nowWeather = null; object? nextWeather = null;
            if (weather is not null) { weather.TryGetValue(todayIso, out nowWeather); weather.TryGetValue(tomorrowIso, out nextWeather); }
            return new { municipality = name, isPrincipal = string.Equals(name, selected.PrincipalMunicipality, StringComparison.OrdinalIgnoreCase), comarca = now?.Comarca ?? next?.Comarca, todayLevel = now?.Level, tomorrowLevel = next?.Level, todayForecast = nowWeather, todayForecastSource = nowWeather is null ? null : "open-meteo", tomorrowForecast = nextWeather, tomorrowForecastSource = nextWeather is null ? null : "open-meteo", forecastSource = weather is null ? null : "open-meteo", todayObjectId = now?.Id, tomorrowObjectId = next?.Id, foundToday = now is not null, foundTomorrow = next is not null };
        }).ToList();
        object result = new { updatedAt = DateTime.UtcNow, principalMunicipality = selected.PrincipalMunicipality, municipalities = rows, warnings };
        StatusCache[key] = new Cache(DateTime.UtcNow, result);
        return result;
    }
    private async Task<Dictionary<string, Pla>> QueryAsync(string url, string idField, List<string> names, List<object> warnings, string source)
    {
        if (names.Count == 0) return [];
        try
        {
            var where = string.Join(',', names.Select(name => $"'{name.Replace("'", "''")}'"));
            var data = await GetJsonAsync(url + $"?f=pjson&where=NOMMUNI%20IN%20({Uri.EscapeDataString(where)})&outFields=NOMMUNI%2CNOMCOMAR%2CPERIL_M%2C{idField}&returnGeometry=false");
            return Features(data).Where(feature => GetString(feature, "NOMMUNI") is not null).ToDictionary(feature => Normalize(GetString(feature, "NOMMUNI")!), feature => new Pla(GetString(feature, "NOMCOMAR"), NormalizeLevel(GetInt(feature, "PERIL_M")), GetInt(feature, idField)));
        }
        catch (Exception error) { warnings.Add(new { source, message = error.Message }); return []; }
    }
    private async Task<Dictionary<string, Dictionary<string, object>>> ForecastAsync(List<string> names, List<object> warnings)
    {
        var result = new Dictionary<string, Dictionary<string, object>>();
        foreach (var name in names)
        {
            try
            {
                var geo = await GetJsonAsync($"https://geocoding-api.open-meteo.com/v1/search?name={Uri.EscapeDataString(name)}&count=1&language=es&countryCode=ES&format=json");
                var hit = geo.TryGetProperty("results", out var hits) && hits.GetArrayLength() > 0 ? hits[0] : default;
                if (hit.ValueKind == JsonValueKind.Undefined) continue;
                var latitude = hit.GetProperty("latitude").GetDouble(); var longitude = hit.GetProperty("longitude").GetDouble();
                var weather = await GetJsonAsync($"https://api.open-meteo.com/v1/forecast?latitude={latitude.ToString(CultureInfo.InvariantCulture)}&longitude={longitude.ToString(CultureInfo.InvariantCulture)}&daily=temperature_2m_min,temperature_2m_max,relative_humidity_2m_min,relative_humidity_2m_max,wind_speed_10m_max,wind_direction_10m_dominant&timezone=Europe%2FMadrid&forecast_days=3");
                var daily = weather.GetProperty("daily"); var dates = daily.GetProperty("time"); var values = new Dictionary<string, object>();
                for (var i = 0; i < dates.GetArrayLength(); i++) values[dates[i].GetString()!] = new { temperatureC = new { min = daily.GetProperty("temperature_2m_min")[i].GetDouble(), max = daily.GetProperty("temperature_2m_max")[i].GetDouble() }, humidityPct = new { min = daily.GetProperty("relative_humidity_2m_min")[i].GetDouble(), max = daily.GetProperty("relative_humidity_2m_max")[i].GetDouble() }, wind = new { maxSpeedKmh = daily.GetProperty("wind_speed_10m_max")[i].GetDouble(), direction = Direction(daily.GetProperty("wind_direction_10m_dominant")[i].GetDouble()) } };
                result[Normalize(name)] = values;
            }
            catch (Exception error) { warnings.Add(new { source = "open-meteo", municipality = name, message = error.Message }); }
        }
        return result;
    }
    private async Task<JsonElement> GetJsonAsync(string url) { using var response = await clients.CreateClient("pla-alfa").GetAsync(url); response.EnsureSuccessStatusCode(); return JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement.Clone(); }
    private Selection Read() => !File.Exists(SelectionPath) ? new([], null) : JsonSerializer.Deserialize<Selection>(File.ReadAllText(SelectionPath), new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new([], null);
    private static IEnumerable<JsonElement> Features(JsonElement root) => root.TryGetProperty("features", out var features) ? features.EnumerateArray() : [];
    private static string? GetString(JsonElement feature, string key) => feature.TryGetProperty("attributes", out var attrs) && attrs.TryGetProperty(key, out var value) && value.ValueKind != JsonValueKind.Null ? value.ToString() : null;
    private static int? GetInt(JsonElement feature, string key) => int.TryParse(GetString(feature, key), out var value) ? value : null;
    private static int? NormalizeLevel(int? level) => level == 5 ? null : level;
    private static string Normalize(string value) => value.Trim().ToLowerInvariant();
    private static string Direction(double degrees) => new[] { "N", "NE", "E", "SE", "S", "SO", "O", "NO" }[(int)Math.Round((((degrees % 360) + 360) % 360) / 45) % 8];
    private sealed record Selection(List<string> Municipalities, string? PrincipalMunicipality);
    private sealed record Pla(string? Comarca, int? Level, int? Id);
    private sealed record Cache(DateTime CreatedAt, object Payload);
}
