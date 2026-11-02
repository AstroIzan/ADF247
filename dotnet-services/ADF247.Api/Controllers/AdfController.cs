using ADF247.Api.Data;
using ADF247.Api.Models;
using ADF247.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace ADF247.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/adf")]
public sealed class AdfController(Adf247DbContext database, CurrentAdf currentAdf) : ControllerBase
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var privileged = await IsPrivilegedAsync();
        var ownAdfId = currentAdf.AdfId;
        var query = database.Adfs.AsNoTracking().AsQueryable();
        if (!privileged) query = query.Where(adf => adf.Id == ownAdfId);
        var items = await query.OrderBy(adf => adf.Number).ToListAsync();
        return Ok(items.Select(Map));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AdfRequest request)
    {
        if (!await IsPrivilegedAsync()) return Forbid();
        var error = Validate(request);
        if (error is not null) return BadRequest(new { message = error });
        if (await database.Adfs.AnyAsync(adf => adf.Number == request.Number))
            return BadRequest(new { message = "Ya existe una ADF con ese número." });
        var now = DateTime.UtcNow;
        var adf = new Adf
        {
            Number = request.Number!.Value,
            Name = request.Name!.Trim(),
            MunicipalitiesJson = SerializeMunicipalities(request.Municipalities),
            CreatedAt = now,
            UpdatedAt = now,
        };
        database.Adfs.Add(adf);
        await database.SaveChangesAsync();
        return Ok(Map(adf));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AdfRequest request)
    {
        if (!await IsPrivilegedAsync()) return Forbid();
        var error = Validate(request);
        if (error is not null) return BadRequest(new { message = error });
        var adf = await database.Adfs.SingleOrDefaultAsync(item => item.Id == id);
        if (adf is null) return NotFound(new { message = "No se ha encontrado la ADF." });
        if (await database.Adfs.AnyAsync(item => item.Number == request.Number && item.Id != id))
            return BadRequest(new { message = "Ya existe una ADF con ese número." });
        adf.Number = request.Number!.Value;
        adf.Name = request.Name!.Trim();
        adf.MunicipalitiesJson = SerializeMunicipalities(request.Municipalities);
        adf.UpdatedAt = DateTime.UtcNow;
        await database.SaveChangesAsync();
        return Ok(Map(adf));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!await IsPrivilegedAsync()) return Forbid();
        var adf = await database.Adfs.SingleOrDefaultAsync(item => item.Id == id);
        if (adf is null) return NotFound(new { message = "No se ha encontrado la ADF." });
        currentAdf.AdfId = null;
        if (await database.Users.AnyAsync(user => user.AdfId == id) || await database.Convocatorias.AnyAsync(convo => convo.AdfId == id))
            return BadRequest(new { message = "No se puede eliminar una ADF con usuarios o convocatorias asociadas." });
        database.Adfs.Remove(adf);
        await database.SaveChangesAsync();
        return Ok(Map(adf));
    }

    [HttpGet("overview")]
    public async Task<IActionResult> Overview()
    {
        if (!await IsPrivilegedAsync()) return Forbid();
        currentAdf.AdfId = null;
        var now = DateTime.Now;
        var adfs = await database.Adfs.AsNoTracking().OrderBy(adf => adf.Number).ToListAsync();
        var users = await database.Users.AsNoTracking().GroupBy(user => user.AdfId)
            .Select(group => new { AdfId = group.Key, Total = group.Count(), Active = group.Count(user => user.IsActive) }).ToListAsync();
        var convos = await database.Convocatorias.AsNoTracking().GroupBy(convo => convo.AdfId)
            .Select(group => new
            {
                AdfId = group.Key,
                Total = group.Count(),
                Upcoming = group.Count(convo => convo.StartTime >= now),
                InProgress = group.Count(convo => convo.ActualStartTime != null && convo.ActualEndTime == null),
            }).ToListAsync();
        var vehicleCounts = await database.Vehicles.AsNoTracking().GroupBy(vehicle => vehicle.AdfId)
            .Select(group => new { AdfId = group.Key, Total = group.Count() }).ToListAsync();
        var responses = await database.Respuestas.AsNoTracking().GroupBy(response => response.AdfId)
            .Select(group => new { AdfId = group.Key, Total = group.Count() }).ToListAsync();

        return Ok(adfs.Select(adf =>
        {
            var u = users.FirstOrDefault(item => item.AdfId == adf.Id);
            var c = convos.FirstOrDefault(item => item.AdfId == adf.Id);
            return new
            {
                adf = Map(adf),
                users = u?.Total ?? 0,
                activeUsers = u?.Active ?? 0,
                vehicles = vehicleCounts.FirstOrDefault(item => item.AdfId == adf.Id)?.Total ?? 0,
                convocatorias = c?.Total ?? 0,
                upcomingConvocatorias = c?.Upcoming ?? 0,
                inProgressConvocatorias = c?.InProgress ?? 0,
                responses = responses.FirstOrDefault(item => item.AdfId == adf.Id)?.Total ?? 0,
            };
        }));
    }

    [HttpGet("{id:int}/convocatorias")]
    public async Task<IActionResult> Convocatorias(int id, [FromQuery] int? limit)
    {
        if (!await IsPrivilegedAsync()) return Forbid();
        currentAdf.AdfId = null;
        var take = Math.Clamp(limit ?? 100, 1, 500);
        var items = await database.Convocatorias.AsNoTracking()
            .Where(convo => convo.AdfId == id)
            .OrderByDescending(convo => convo.StartTime)
            .Take(take)
            .Select(convo => new
            {
                id = convo.Id,
                adfId = convo.AdfId,
                title = convo.Title,
                date = convo.Date,
                startTime = convo.StartTime,
                finalTime = convo.FinalTime,
                isActive = convo.IsActive,
                sortida = convo.Sortida,
                actualStartTime = convo.ActualStartTime,
                actualEndTime = convo.ActualEndTime,
                type = convo.ConvoType!.Name,
                responses = database.Respuestas.Count(response => response.ConvoId == convo.Id),
            }).ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id:int}/users")]
    public async Task<IActionResult> Users(int id)
    {
        if (!await IsPrivilegedAsync()) return Forbid();
        currentAdf.AdfId = null;
        var items = await (from user in database.Users.AsNoTracking()
                           where user.AdfId == id
                           join role in database.Roles.AsNoTracking() on user.NCarnet equals role.NCarnet into roles
                           from role in roles.DefaultIfEmpty()
                           orderby user.Name
                           select new
                           {
                               id = user.Id,
                               adfId = user.AdfId,
                               nCarnet = user.NCarnet,
                               name = user.Name,
                               lastName = user.LastName,
                               nIndicatiu = user.NIndicatiu,
                               isActive = user.IsActive,
                               isAdmin = role != null && role.IsAdmin,
                               isDeveloper = role != null && role.IsDeveloper,
                               isSecretariat = role != null && role.IsSecretariat,
                               isCapOperatiu = role != null && role.IsCapOperatiu,
                               isCapColla = role != null && role.IsCapColla,
                               isGroc = role != null && role.IsGroc,
                               isVerd = role == null || !role.IsGroc,
                           }).ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id:int}/vehicles")]
    public async Task<IActionResult> Vehicles(int id)
    {
        if (!await IsPrivilegedAsync()) return Forbid();
        currentAdf.AdfId = null;
        var items = await database.Vehicles.AsNoTracking()
            .Where(vehicle => vehicle.AdfId == id)
            .OrderBy(vehicle => vehicle.Indicatiu)
            .Select(vehicle => new { id = vehicle.Id, indicatiu = vehicle.Indicatiu, modelo = vehicle.Modelo, matricula = vehicle.Matricula, litres = vehicle.Litres })
            .ToListAsync();
        return Ok(items);
    }

    private async Task<bool> IsPrivilegedAsync()
    {
        var carnet = User.FindFirst("nCarnet")?.Value;
        if (string.IsNullOrWhiteSpace(carnet)) return false;
        return await database.Roles.AsNoTracking().AnyAsync(role => role.NCarnet == carnet && (role.IsAdmin || role.IsSecretariat));
    }

    private static string? Validate(AdfRequest request)
    {
        if (request.Number is null or <= 0) return "El número de ADF es obligatorio.";
        if (string.IsNullOrWhiteSpace(request.Name)) return "El nombre de la ADF es obligatorio.";
        return null;
    }

    private static string SerializeMunicipalities(IReadOnlyList<string>? municipalities) =>
        JsonSerializer.Serialize((municipalities ?? [])
            .Select(item => item?.Trim())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList(), Json);

    private static object Map(Adf adf)
    {
        IReadOnlyList<string> municipalities;
        try { municipalities = JsonSerializer.Deserialize<List<string>>(adf.MunicipalitiesJson, Json) ?? []; }
        catch (JsonException) { municipalities = []; }
        return new { id = adf.Id, number = adf.Number, name = adf.Name, municipalities, createdAt = adf.CreatedAt, updatedAt = adf.UpdatedAt };
    }
}

public sealed record AdfRequest(int? Number, string? Name, IReadOnlyList<string>? Municipalities);
