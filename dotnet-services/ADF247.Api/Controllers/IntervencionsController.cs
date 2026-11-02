using ADF247.Api.Data;
using ADF247.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text.Json;

namespace ADF247.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/intervencions")]
public sealed class IntervencionsController(Adf247DbContext database) : ControllerBase
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private static readonly string[] StandardIncendiTypes =
    [
        "IF.A – Incendi Forestal d'Arbrat",
        "IF.M – Incendi Forestal de Matollar",
        "IF.P – Incendi Forestal de Pastures",
        "IF.R – Incendi Forestal de Ribera i Canyars",
        "IV.AGR – Incendi de Vegetació Agrícola",
        "IV.AGR-C – Camps de Cereals o Restolls",
        "IV.AGR-F – Arbres Fruiters o Conreus Llenyosos",
        "IV.URB – Incendi de Vegetació Urbana",
        "IV.IUF – Incendi d'Interfície Urbano-Forestal",
        "IV.VIA – Incendi de Marges de Vies de Comunicació",
    ];

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int? convocatoriaId, [FromQuery] string? date)
    {
        var identity = await IdentityAsync();
        if (identity is null) return Unauthorized();

        IQueryable<Intervencio> query = database.Intervencions.AsNoTracking().Include(item => item.Responsable);
        if (convocatoriaId.HasValue)
        {
            if (!await CanAccessConvocatoriaAsync(identity.Value, convocatoriaId.Value)) return Forbid();
            query = query.Where(item => item.ConvocatoriaId == convocatoriaId.Value);
        }
        else
        {
            if (!identity.Value.IsManager) return Forbid();
            if (!DateOnly.TryParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var day))
                return BadRequest(new { message = "La fecha debe tener el formato yyyy-MM-dd." });
            query = query.Where(item => item.Date == day);
        }

        var items = await query.OrderBy(item => item.Date).ThenBy(item => item.StartTime).ThenBy(item => item.Id).ToListAsync();
        return Ok(items.Select(Map));
    }

    [HttpGet("context")]
    public async Task<IActionResult> Context([FromQuery] string? date, [FromQuery] string? time, [FromQuery] int? convocatoriaId)
    {
        var identity = await IdentityAsync();
        if (identity is null) return Unauthorized();
        if (convocatoriaId.HasValue ? !await CanAccessConvocatoriaAsync(identity.Value, convocatoriaId.Value) : !identity.Value.IsManager) return Forbid();

        var users = await database.Users.AsNoTracking()
            .Where(user => user.IsActive)
            .OrderBy(user => user.NIndicatiu).ThenBy(user => user.Name)
            .Select(user => new { id = user.Id, nCarnet = user.NCarnet, name = user.Name, lastName = user.LastName, nIndicatiu = user.NIndicatiu })
            .ToListAsync();
        var existingTypes = await database.TypeIncendis.ToListAsync();
        var missingTypes = StandardIncendiTypes.Where(name => existingTypes.All(type => type.Name != name)).ToList();
        if (missingTypes.Count > 0)
        {
            foreach (var name in missingTypes)
            {
                var created = new TypeIncendi { Name = name };
                database.TypeIncendis.Add(created);
                existingTypes.Add(created);
            }
            await database.SaveChangesAsync();
        }
        var types = existingTypes
            .Where(type => StandardIncendiTypes.Contains(type.Name))
            .OrderBy(type => Array.IndexOf(StandardIncendiTypes, type.Name))
            .Select(type => new { id = type.Id, name = type.Name }).ToList();
        var adfs = await database.Adfs.AsNoTracking().OrderBy(adf => adf.Number).Select(adf => new { id = adf.Id, number = adf.Number, name = adf.Name }).ToListAsync();
        var vehicleNames = await database.Vehicles.AsNoTracking().OrderBy(vehicle => vehicle.Indicatiu).Select(vehicle => vehicle.Indicatiu).ToListAsync();

        object? matched = null;
        var candidates = new List<object>();
        if (DateOnly.TryParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var day))
        {
            var from = day.ToDateTime(TimeOnly.MinValue);
            var to = from.AddDays(1);
            var convos = await database.Convocatorias.AsNoTracking()
                .Include(convo => convo.Responsable).Include(convo => convo.ConvoType)
                .Where(convo => convo.StartTime >= from && convo.StartTime < to)
                .OrderBy(convo => convo.StartTime).ToListAsync();
            TimeOnly? at = TimeOnly.TryParseExact(time, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed) ? parsed : null;
            foreach (var convo in convos)
            {
                var started = convo.ActualStartTime.HasValue;
                var item = new
                {
                    id = convo.Id,
                    title = convo.Title,
                    type = convo.ConvoType?.Name,
                    startTime = convo.StartTime,
                    finalTime = convo.FinalTime,
                    started,
                    responsableId = convo.ResponsableId,
                    responsableName = convo.Responsable is null ? null : $"{convo.Responsable.Name} {convo.Responsable.LastName}".Trim(),
                };
                candidates.Add(item);
                if (matched is null && started && at.HasValue)
                {
                    var begin = convo.ActualStartTime!.Value;
                    var end = convo.ActualEndTime ?? convo.FinalTime ?? begin.Date.AddDays(1);
                    var moment = day.ToDateTime(at.Value);
                    if (moment >= begin && moment <= end) matched = item;
                }
            }
        }

        object[] convocatoriaVehicles = [];
        if (convocatoriaId.HasValue) convocatoriaVehicles = await ConvocatoriaVehiclesAsync(convocatoriaId.Value);

        return Ok(new { users, types, adfs, vehicleCatalog = vehicleNames, matched, candidates, convocatoriaVehicles });
    }

    [HttpGet("convocatoria-vehicles/{convocatoriaId:int}")]
    public async Task<IActionResult> ConvocatoriaVehicles(int convocatoriaId)
    {
        var identity = await IdentityAsync();
        if (identity is null) return Unauthorized();
        if (!await CanAccessConvocatoriaAsync(identity.Value, convocatoriaId) && !identity.Value.IsManager) return Forbid();
        return Ok(await ConvocatoriaVehiclesAsync(convocatoriaId));
    }

    [HttpPost("types")]
    public async Task<IActionResult> CreateType([FromBody] TypeIncendiRequest request)
    {
        var identity = await IdentityAsync();
        if (identity is null) return Unauthorized();
        var name = request.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name)) return BadRequest(new { message = "El nombre del tipo es obligatorio." });
        var existing = await database.TypeIncendis.FirstOrDefaultAsync(type => type.Name == name);
        if (existing is not null) return Ok(new { id = existing.Id, name = existing.Name });
        var type = new TypeIncendi { Name = name };
        database.TypeIncendis.Add(type);
        await database.SaveChangesAsync();
        return Ok(new { id = type.Id, name = type.Name });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] IntervencioRequest request)
    {
        var identity = await IdentityAsync();
        if (identity is null) return Unauthorized();
        var denied = await AuthorizeWriteAsync(identity.Value, request.ConvocatoriaId);
        if (denied is not null) return denied;

        var entity = new Intervencio { CreatedByNCarnet = identity.Value.Carnet, CreatedAt = DateTime.UtcNow };
        var error = Apply(entity, request);
        if (error is not null) return BadRequest(new { message = error });
        if (request.ConvocatoriaId.HasValue)
        {
            var adfId = await database.Convocatorias.Where(convo => convo.Id == request.ConvocatoriaId.Value).Select(convo => (int?)convo.AdfId).FirstOrDefaultAsync();
            if (adfId is null) return BadRequest(new { message = "La convocatoria indicada no existe." });
        }
        database.Intervencions.Add(entity);
        await database.SaveChangesAsync();
        return Ok(Map(entity));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] IntervencioRequest request)
    {
        var identity = await IdentityAsync();
        if (identity is null) return Unauthorized();
        var entity = await database.Intervencions.SingleOrDefaultAsync(item => item.Id == id);
        if (entity is null) return NotFound(new { message = "No se ha encontrado la intervención." });
        var denied = await AuthorizeWriteAsync(identity.Value, entity.ConvocatoriaId);
        if (denied is not null) return denied;
        var error = Apply(entity, request with { ConvocatoriaId = entity.ConvocatoriaId });
        if (error is not null) return BadRequest(new { message = error });
        await database.SaveChangesAsync();
        return Ok(Map(entity));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var identity = await IdentityAsync();
        if (identity is null) return Unauthorized();
        var entity = await database.Intervencions.SingleOrDefaultAsync(item => item.Id == id);
        if (entity is null) return NotFound(new { message = "No se ha encontrado la intervención." });
        var denied = await AuthorizeWriteAsync(identity.Value, entity.ConvocatoriaId);
        if (denied is not null) return denied;
        database.Intervencions.Remove(entity);
        await database.SaveChangesAsync();
        return Ok(new { id });
    }

    private async Task<IActionResult?> AuthorizeWriteAsync((int UserId, string Carnet, bool IsManager) identity, int? convocatoriaId)
    {
        if (identity.IsManager) return null;
        if (convocatoriaId.HasValue && await CanAccessConvocatoriaAsync(identity, convocatoriaId.Value)) return null;
        return Forbid();
    }

    private async Task<bool> CanAccessConvocatoriaAsync((int UserId, string Carnet, bool IsManager) identity, int convocatoriaId)
    {
        if (identity.IsManager) return await database.Convocatorias.AnyAsync(convo => convo.Id == convocatoriaId);
        return await database.Convocatorias.AnyAsync(convo => convo.Id == convocatoriaId && convo.ResponsableId == identity.UserId);
    }

    private async Task<(int UserId, string Carnet, bool IsManager)?> IdentityAsync()
    {
        var carnet = User.FindFirst("nCarnet")?.Value;
        if (string.IsNullOrWhiteSpace(carnet)) return null;
        var user = await database.Users.AsNoTracking().Where(item => item.NCarnet == carnet).Select(item => new { item.Id }).SingleOrDefaultAsync();
        if (user is null) return null;
        var manager = await database.Roles.AnyAsync(role => role.NCarnet == carnet && (role.IsAdmin || role.IsCapOperatiu || role.IsCapColla));
        return (user.Id, carnet, manager);
    }

    private async Task<object[]> ConvocatoriaVehiclesAsync(int convocatoriaId)
    {
        var forms = await database.CampaignForms.AsNoTracking()
            .Where(form => form.ConvocatoriaId == convocatoriaId)
            .OrderBy(form => form.ServiceMoment == "START" ? 0 : 1).ThenByDescending(form => form.UpdatedAt)
            .ToListAsync();
        var form = forms.FirstOrDefault();
        if (form is null) return [];

        List<FormVehicle> vehicles;
        try { vehicles = JsonSerializer.Deserialize<List<FormVehicle>>(form.VehiclesJson, Json) ?? []; }
        catch (JsonException) { return []; }

        var userIds = vehicles.SelectMany(vehicle => (vehicle.VolunteerUserIds ?? []).Concat(vehicle.ConductorUserId.HasValue ? [vehicle.ConductorUserId.Value] : [])).Distinct().ToList();
        var carnets = await database.Users.AsNoTracking().Where(user => userIds.Contains(user.Id)).Select(user => new { user.Id, user.NCarnet, user.Name, user.LastName, user.NIndicatiu }).ToListAsync();
        var grocCarnets = (await database.Roles.AsNoTracking().Where(role => role.IsGroc).Select(role => role.NCarnet).ToListAsync()).ToHashSet();
        var grocIds = carnets.Where(item => grocCarnets.Contains(item.NCarnet)).Select(item => item.Id).ToHashSet();

        return vehicles.Select(vehicle =>
        {
            var members = (vehicle.VolunteerUserIds ?? []).Concat(vehicle.ConductorUserId.HasValue ? [vehicle.ConductorUserId.Value] : []).Distinct().ToList();
            var grocs = members.Count(grocIds.Contains);
            var volunteers = members.Select(id => carnets.FirstOrDefault(item => item.Id == id)).Where(item => item is not null)
                .Select(item => new { id = item!.Id, nCarnet = item.NCarnet, name = $"{item.Name} {item.LastName}".Trim(), nIndicatiu = item.NIndicatiu, isGroc = grocIds.Contains(item.Id) }).ToList();
            return (object)new { vehicleName = vehicle.VehicleName, grocs, verds = members.Count - grocs, volunteers };
        }).ToArray();
    }

    private static List<string> ReadVehicleCatalog(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            using var document = JsonDocument.Parse(json);
            return document.RootElement.EnumerateArray()
                .Select(item => item.TryGetProperty("indicatiu", out var value) ? value.GetString() : null)
                .Where(value => !string.IsNullOrWhiteSpace(value)).Select(value => value!).ToList();
        }
        catch (JsonException) { return []; }
    }

    private static string? Apply(Intervencio entity, IntervencioRequest request)
    {
        if (!DateOnly.TryParseExact(request.Date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
            return "La fecha es obligatoria (yyyy-MM-dd).";
        if (!TryTime(request.NoticeTime, out var notice) || !TryTime(request.StartTime, out var start) || !TryTime(request.EndTime, out var end))
            return "Las horas deben tener el formato HH:mm.";
        if (request.Level is < 0 or > 5) return "El nivel debe estar entre 0 y 5.";
        if (request.Surface is < 0) return "La superficie no puede ser negativa.";

        entity.ConvocatoriaId = request.ConvocatoriaId;
        entity.ResponsableUserId = request.ResponsableUserId;
        entity.ResponsableName = Clean(request.ResponsableName);
        entity.ResponsableAdf = Clean(request.ResponsableAdf);
        entity.Date = date;
        entity.NoticeTime = notice;
        entity.StartTime = start;
        entity.EndTime = end;
        entity.Level = request.Level;
        entity.Latitude = request.Latitude;
        entity.Longitude = request.Longitude;
        entity.MapsUrl = request.Latitude.HasValue && request.Longitude.HasValue
            ? $"https://www.google.com/maps?q={request.Latitude.Value.ToString(CultureInfo.InvariantCulture)},{request.Longitude.Value.ToString(CultureInfo.InvariantCulture)}"
            : null;
        entity.Municipality = Clean(request.Municipality);
        entity.Sector = Clean(request.Sector);
        entity.Comarca = Clean(request.Comarca);
        entity.OwnVehiclesJson = JsonSerializer.Serialize(request.OwnVehicles ?? [], Json);
        entity.OtherAdfsAttended = request.OtherAdfsAttended;
        entity.OtherAdfsJson = JsonSerializer.Serialize(request.OtherAdfsAttended ? request.OtherAdfs ?? [] : [], Json);
        entity.OtherAdfsGrocs = request.OtherAdfsAttended ? Math.Max(0, request.OtherAdfsGrocs) : 0;
        entity.OtherAdfsVerds = request.OtherAdfsAttended ? Math.Max(0, request.OtherAdfsVerds) : 0;
        entity.BombersAttended = request.BombersAttended;
        entity.BombersJson = JsonSerializer.Serialize(request.BombersAttended ? request.Bombers ?? [] : [], Json);
        entity.OwnGrocs = Math.Max(0, request.OwnGrocs);
        entity.OwnVerds = Math.Max(0, request.OwnVerds);
        entity.CustomGrocs = Math.Max(0, request.CustomGrocs);
        entity.CustomVerds = Math.Max(0, request.CustomVerds);
        entity.Surface = request.Surface;
        entity.TypeIncendiId = request.TypeIncendiId;
        entity.UpdatedAt = DateTime.UtcNow;
        return null;
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static bool TryTime(string? value, out TimeOnly? time)
    {
        time = null;
        if (string.IsNullOrWhiteSpace(value)) return true;
        if (!TimeOnly.TryParseExact(value.Trim(), ["HH:mm", "HH:mm:ss"], CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed)) return false;
        time = parsed;
        return true;
    }

    private static object Map(Intervencio item) => new
    {
        id = item.Id,
        adfId = item.AdfId,
        convocatoriaId = item.ConvocatoriaId,
        responsableUserId = item.ResponsableUserId,
        responsableName = item.ResponsableName,
        responsableAdf = item.ResponsableAdf,
        responsableDisplay = item.Responsable is not null ? $"{item.Responsable.Name} {item.Responsable.LastName}".Trim() : item.ResponsableName,
        date = item.Date.ToString("yyyy-MM-dd"),
        noticeTime = item.NoticeTime?.ToString("HH:mm"),
        startTime = item.StartTime?.ToString("HH:mm"),
        endTime = item.EndTime?.ToString("HH:mm"),
        level = item.Level,
        mapsUrl = item.MapsUrl,
        latitude = item.Latitude,
        longitude = item.Longitude,
        municipality = item.Municipality,
        sector = item.Sector,
        comarca = item.Comarca,
        ownVehicles = Parse<List<string>>(item.OwnVehiclesJson) ?? [],
        otherAdfsAttended = item.OtherAdfsAttended,
        otherAdfs = Parse<List<OtherAdfEntry>>(item.OtherAdfsJson) ?? [],
        otherAdfsGrocs = item.OtherAdfsGrocs,
        otherAdfsVerds = item.OtherAdfsVerds,
        bombersAttended = item.BombersAttended,
        bombers = Parse<List<BomberEntry>>(item.BombersJson) ?? [],
        ownGrocs = item.OwnGrocs,
        ownVerds = item.OwnVerds,
        customGrocs = item.CustomGrocs,
        customVerds = item.CustomVerds,
        totalGrocs = item.OwnGrocs + item.OtherAdfsGrocs + item.CustomGrocs,
        totalVerds = item.OwnVerds + item.OtherAdfsVerds + item.CustomVerds,
        surface = item.Surface,
        typeIncendiId = item.TypeIncendiId,
        createdAt = item.CreatedAt,
        updatedAt = item.UpdatedAt,
    };

    private static T? Parse<T>(string json)
    {
        try { return JsonSerializer.Deserialize<T>(json, Json); }
        catch (JsonException) { return default; }
    }

    private sealed record FormVehicle(string? VehicleName, int? ConductorUserId, List<int>? VolunteerUserIds);
}

public sealed record OtherAdfEntry(string? Adf, string? Vehicle, bool FirstIntervention);
public sealed record BomberEntry(string? Vehicle, bool FirstIntervention);
public sealed record TypeIncendiRequest(string? Name);

public sealed record IntervencioRequest(
    int? ConvocatoriaId,
    int? ResponsableUserId,
    string? ResponsableName,
    string? ResponsableAdf,
    string? Date,
    string? NoticeTime,
    string? StartTime,
    string? EndTime,
    int? Level,
    double? Latitude,
    double? Longitude,
    string? Municipality,
    string? Sector,
    string? Comarca,
    List<string>? OwnVehicles,
    bool OtherAdfsAttended,
    List<OtherAdfEntry>? OtherAdfs,
    int OtherAdfsGrocs,
    int OtherAdfsVerds,
    bool BombersAttended,
    List<BomberEntry>? Bombers,
    int OwnGrocs,
    int OwnVerds,
    int CustomGrocs,
    int CustomVerds,
    decimal? Surface,
    int? TypeIncendiId);
