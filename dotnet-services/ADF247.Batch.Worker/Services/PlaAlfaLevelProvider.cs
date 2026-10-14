using System.Text.Json;

namespace ADF247.Batch.Worker.Services;

public sealed class PlaAlfaLevelProvider(HttpClient client)
{
    private const string TodayUrl =
        "https://services7.arcgis.com/ZCqVt1fRXwwK6GF4/ArcGIS/rest/services/Pla_Alfa_Municipal_Avui_FL_alternatiu_VW/FeatureServer/0/query";

    public async Task<int?> GetHighestLevelAsync(
        IReadOnlyCollection<string> municipalities,
        CancellationToken cancellationToken)
    {
        if (municipalities.Count == 0)
            return null;

        var quotedMunicipalities = string.Join(
            ',',
            municipalities.Select(value => $"'{value.Replace("'", "''")}'"));
        var url = TodayUrl
            + $"?f=pjson&where=NOMMUNI%20IN%20({Uri.EscapeDataString(quotedMunicipalities)})"
            + "&outFields=NOMMUNI%2CPERIL_M&returnGeometry=false";
        using var response = await client.GetAsync(url, cancellationToken);
        response.EnsureSuccessStatusCode();

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        if (!document.RootElement.TryGetProperty("features", out var features))
            return null;

        var levels = new List<int>();
        foreach (var feature in features.EnumerateArray())
        {
            if (!feature.TryGetProperty("attributes", out var attributes)
                || !attributes.TryGetProperty("PERIL_M", out var rawLevel)
                || !TryGetLevel(rawLevel, out var level)
                || level == 5)
                continue;

            levels.Add(level);
        }

        return levels.Count == 0 ? null : levels.Max();
    }

    private static bool TryGetLevel(JsonElement value, out int level)
    {
        level = 0;
        return value.ValueKind switch
        {
            JsonValueKind.Number => value.TryGetInt32(out level),
            JsonValueKind.String => int.TryParse(value.GetString(), out level),
            _ => false,
        };
    }
}
