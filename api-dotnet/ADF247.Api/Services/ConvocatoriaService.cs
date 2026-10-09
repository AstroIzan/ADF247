using System.Text.Json;
using ADF247.Api.Contracts;
using ADF247.Api.Data;
using ADF247.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ADF247.Api.Services;

public sealed class ConvocatoriaService(
    Adf247DbContext database,
    ConvocatoriaCalculationService calculations,
    IConfiguration configuration)
{
    public async Task<IReadOnlyList<object>> GetTypesAsync() =>
        (await database.ConvoTypes.OrderBy(type => type.Id).ToListAsync()).Select(MapType).ToList();

    public async Task<object?> GetTypeAsync(int id)
    {
        var type = await database.ConvoTypes.FindAsync(id);
        return type is null ? null : MapType(type);
    }

    public async Task<object> CreateTypeAsync(ConvoTypeRequest request)
    {
        var type = new ConvoType
        {
            Name = Required(request.Name, "name"),
            MinGrocSortida = NonNegative(request.MinGrocSortida ?? 0, "minGrocSortida"),
            MinVerdSortida = NonNegative(request.MinVerdSortida ?? 0, "minVerdSortida"),
            DefaultLocation = Optional(request.DefaultLocation),
        };
        database.ConvoTypes.Add(type);
        await SaveAsync();
        return MapType(type);
    }

    public async Task<object?> UpdateTypeAsync(int id, ConvoTypeRequest request)
    {
        var type = await database.ConvoTypes.FindAsync(id);
        if (type is null) return null;
        if (request.Name is not null) type.Name = Required(request.Name, "name");
        if (request.MinGrocSortida.HasValue) type.MinGrocSortida = NonNegative(request.MinGrocSortida.Value, "minGrocSortida");
        if (request.MinVerdSortida.HasValue) type.MinVerdSortida = NonNegative(request.MinVerdSortida.Value, "minVerdSortida");
        if (request.DefaultLocation is not null) type.DefaultLocation = Optional(request.DefaultLocation);
        await SaveAsync();
        return MapType(type);
    }

    public async Task<object?> DeleteTypeAsync(int id)
    {
        var type = await database.ConvoTypes.FindAsync(id);
        if (type is null) return null;
        database.ConvoTypes.Remove(type);
        await SaveAsync();
        return MapType(type);
    }

    public async Task<object> GetAllAsync(int? page, int? pageSize)
    {
        if (page.HasValue != pageSize.HasValue) throw new ArgumentException("Debes enviar \"page\" y \"pageSize\" juntos para usar paginacion.");
        var query = IncludeConvocatoria(database.Convocatorias).OrderBy(convo => convo.Id);
        if (!page.HasValue) return (await query.ToListAsync()).Select(MapConvocatoria).ToList();
        if (page < 1 || pageSize < 1) throw new ArgumentException("Los parametros de paginacion deben ser numeros enteros positivos.");
        var total = await query.CountAsync();
        var items = await query.Skip((page.Value - 1) * pageSize!.Value).Take(pageSize.Value).ToListAsync();
        return new { items = items.Select(MapConvocatoria).ToList(), pagination = new { page, pageSize, total, totalPages = Math.Max(1, (int)Math.Ceiling(total / (double)pageSize.Value)) } };
    }

    public async Task<object?> GetAsync(int id)
    {
        var convo = await IncludeConvocatoria(database.Convocatorias).SingleOrDefaultAsync(item => item.Id == id);
        return convo is null ? null : MapConvocatoria(convo);
    }

    public async Task<object> CreateAsync(ConvocatoriaRequest request)
    {
        var type = await RequireTypeAsync(request.ConvoTypeId);
        if (request.ResponsableId.HasValue) await RequireUserAsync(request.ResponsableId.Value);
        var start = request.StartTime ?? throw new ArgumentException("El campo \"startTime\" es obligatorio.");
        if (request.FinalTime.HasValue && request.FinalTime < start) throw new ArgumentException("El campo \"finalTime\" no puede ser anterior a \"startTime\".");
        var date = request.Date ?? throw new ArgumentException("El campo \"date\" es obligatorio.");
        var location = Optional(request.UbiSortida) ?? type.DefaultLocation ?? (type.Name.Contains("guardia", StringComparison.OrdinalIgnoreCase) || type.Name.Contains("incendi", StringComparison.OrdinalIgnoreCase) ? "Brigadas" : null)
            ?? throw new ArgumentException("El campo \"ubiSortida\" es obligatorio.");
        var convo = new Convocatoria
        {
            Date = date, Title = Optional(request.Title) ?? $"{type.Name} - {date:yyyy-MM-dd}", UbiSortida = location,
            ResponsableId = request.ResponsableId, ConvoTypeId = type.Id, StartTime = start, FinalTime = request.FinalTime,
            IsActive = request.IsActive ?? true, AutoAssignResponsable = request.AutoAssignResponsable ?? false, Sortida = request.Sortida ?? false,
        };
        database.Convocatorias.Add(convo);
        await SaveAsync();
        await calculations.ApplyAvailabilityAsync(convo);
        return (await GetAsync(convo.Id))!;
    }

    public async Task<object?> UpdateAsync(int id, ConvocatoriaRequest request, int userId, bool isAdmin)
    {
        var convo = await IncludeConvocatoria(database.Convocatorias).SingleOrDefaultAsync(item => item.Id == id);
        if (convo is null) return null;
        if (request.Sortida.HasValue) EnsureManager(convo, userId, isAdmin);
        if (request.ConvoTypeId.HasValue) { await RequireTypeAsync(request.ConvoTypeId); convo.ConvoTypeId = request.ConvoTypeId.Value; }
        if (request.ResponsableId.HasValue) { await RequireUserAsync(request.ResponsableId.Value); convo.ResponsableId = request.ResponsableId; }
        if (request.Date.HasValue) convo.Date = request.Date.Value;
        if (request.Title is not null) convo.Title = Required(request.Title, "title");
        if (request.UbiSortida is not null) convo.UbiSortida = Required(request.UbiSortida, "ubiSortida");
        if (request.StartTime.HasValue) convo.StartTime = request.StartTime.Value;
        if (request.FinalTime.HasValue || request.FinalTime is null && HasField(request, nameof(request.FinalTime))) convo.FinalTime = request.FinalTime;
        if (convo.FinalTime.HasValue && convo.FinalTime < convo.StartTime) throw new ArgumentException("El campo \"finalTime\" no puede ser anterior a \"startTime\".");
        if (request.IsActive.HasValue) convo.IsActive = request.IsActive.Value;
        if (request.AutoAssignResponsable.HasValue) convo.AutoAssignResponsable = request.AutoAssignResponsable.Value;
        if (request.Sortida.HasValue) convo.Sortida = request.Sortida.Value;
        await SaveAsync();
        if (convo.AutoAssignResponsable) await calculations.RecalculateResponsableAsync(id);
        return await GetAsync(id);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var convo = await database.Convocatorias.FindAsync(id);
        if (convo is null) return false;
        var forms = database.CampaignForms.Where(form => form.ConvocatoriaId == id);
        var responses = database.Respuestas.Where(response => response.ConvoId == id);
        database.CampaignForms.RemoveRange(forms);
        database.Respuestas.RemoveRange(responses);
        database.Convocatorias.Remove(convo);
        await SaveAsync();
        return true;
    }

    public async Task<object?> UpdateLifecycleAsync(int id, LifecycleRequest request, int userId, bool isAdmin)
    {
        var convo = await IncludeConvocatoria(database.Convocatorias).SingleOrDefaultAsync(item => item.Id == id);
        if (convo is null) return null;
        EnsureManager(convo, userId, isAdmin);
        if (request.ActualStartTime.HasValue) convo.ActualStartTime = request.ActualStartTime;
        if (request.ActualEndTime.HasValue) convo.ActualEndTime = request.ActualEndTime;
        if (!convo.ActualStartTime.HasValue && convo.ActualEndTime.HasValue) throw new ArgumentException("No puedes indicar hora real de fin sin hora real de inicio.");
        if (convo.ActualEndTime < convo.ActualStartTime) throw new ArgumentException("La hora real de fin no puede ser anterior al inicio real.");
        await SaveAsync();
        return MapConvocatoria(convo);
    }

    public async Task<object?> StartAsync(int id, CampaignFormRequest request, int userId, string carnet, bool isAdmin) =>
        await ChangeServiceStateAsync(id, request, userId, carnet, isAdmin, "START");

    public async Task<object?> FinishAsync(int id, CampaignFormRequest request, int userId, string carnet, bool isAdmin) =>
        await ChangeServiceStateAsync(id, request, userId, carnet, isAdmin, "END");

    public async Task<IReadOnlyList<object>> ListFormsAsync(int? convoId, string? moment, int userId, bool isAdmin)
    {
        var query = database.CampaignForms.Include(form => form.Convocatoria).AsQueryable();
        if (convoId.HasValue)
        {
            var convo = await RequireConvocatoriaAsync(convoId.Value);
            EnsureManager(convo, userId, isAdmin);
            query = query.Where(form => form.ConvocatoriaId == convoId);
        }
        else if (!isAdmin) throw new UnauthorizedAccessException();
        if (moment is not null && moment is not ("START" or "END")) throw new ArgumentException("serviceMoment debe ser START o END.");
        if (moment is not null) query = query.Where(form => form.ServiceMoment == moment);
        return (await query.OrderByDescending(form => form.Dia).ThenByDescending(form => form.Id).ToListAsync()).Select(MapForm).ToList();
    }

    public async Task<object?> DeleteFormAsync(int id, int userId, bool isAdmin)
    {
        var form = await database.CampaignForms.Include(item => item.Convocatoria).SingleOrDefaultAsync(item => item.Id == id);
        if (form is null) return null;
        EnsureManager(form.Convocatoria!, userId, isAdmin);
        database.CampaignForms.Remove(form);
        await SaveAsync();
        return MapForm(form);
    }

    public async Task<object> GetCampaignContextAsync(int id, string? mode, int userId, bool isAdmin)
    {
        var convo = await RequireConvocatoriaAsync(id);
        EnsureManager(convo, userId, isAdmin);
        var eligible = await EligibleUsersAsync(id);
        var vehicleCatalog = configuration.GetSection("CampaignForm:VehicleCatalog").Get<List<object>>() ?? [];
        return new { convocatoria = MapConvocatoria(convo), responsable = convo.Responsable is null ? null : new { convo.Responsable.Id, convo.Responsable.NCarnet, convo.Responsable.Name, convo.Responsable.LastName }, eligibleUsers = eligible, vehicleCatalog, lockedVehicleNames = Array.Empty<string>(), prefill = (object?)null };
    }

    private async Task<object?> ChangeServiceStateAsync(int id, CampaignFormRequest request, int userId, string carnet, bool isAdmin, string moment)
    {
        var convo = await RequireConvocatoriaAsync(id);
        EnsureManager(convo, userId, isAdmin);
        if (moment == "START" && convo.ActualStartTime.HasValue) throw new InvalidOperationException("La convocatoria ya fue iniciada.");
        if (moment == "END" && !convo.ActualStartTime.HasValue) throw new InvalidOperationException("Debes iniciar la convocatoria antes de finalizarla.");
        if (moment == "END" && convo.ActualEndTime.HasValue) throw new InvalidOperationException("La convocatoria ya fue finalizada.");
        var now = DateTime.UtcNow;
        if (moment == "START") convo.ActualStartTime = now; else { convo.ActualEndTime = now; convo.IsActive = false; }
        await CreateFormAsync(convo, request, moment, carnet);
        await SaveAsync();
        return MapConvocatoria(convo);
    }

    private async Task CreateFormAsync(Convocatoria convo, CampaignFormRequest request, string moment, string carnet)
    {
        var eligible = await EligibleUsersAsync(convo.Id);
        var eligibleIds = eligible.Select(user => user.Id).ToHashSet();
        var volunteers = (request.VolunteerUserIds ?? []).Distinct().ToList();
        if (volunteers.Any(id => !eligibleIds.Contains(id))) throw new ArgumentException("El formulari inclou voluntaris que no han respost afirmativament o no han assistit.");
        var vehicles = (request.Vehicles ?? []).Select(vehicle => new { vehicleName = Required(vehicle.VehicleName, "vehicleName"), kms = vehicle.Kms ?? 0, conductorUserId = vehicle.ConductorUserId, volunteerUserIds = (vehicle.VolunteerUserIds ?? []).Distinct().ToList() }).ToList();
        if (vehicles.Any(vehicle => vehicle.kms < 0 || vehicle.conductorUserId.HasValue && !eligibleIds.Contains(vehicle.conductorUserId.Value) || vehicle.volunteerUserIds.Any(id => !eligibleIds.Contains(id)))) throw new ArgumentException("El formulario contiene vehiculos o voluntarios no validos.");
        database.CampaignForms.Add(new CampaignForm { ConvocatoriaId = convo.Id, Dia = request.Dia ?? DateTime.UtcNow, ResponsableId = convo.ResponsableId, ResponsableNCarnet = convo.Responsable?.NCarnet, VoluntarisJson = JsonSerializer.Serialize(volunteers), VehiclesJson = JsonSerializer.Serialize(vehicles), ServiceMoment = moment, CreatedByNCarnet = carnet });
    }

    private async Task<List<CampaignUser>> EligibleUsersAsync(int convoId) =>
        (await database.Respuestas.Include(response => response.User).Where(response => response.ConvoId == convoId && response.Response && response.AttendanceConfirmed && response.User!.IsActive).OrderBy(response => response.UserNCarnet).ToListAsync())
        .Select(response => new CampaignUser(response.User!.Id, response.User.NCarnet, response.User.Name, response.User.LastName)).ToList();

    private static IQueryable<Convocatoria> IncludeConvocatoria(IQueryable<Convocatoria> query) => query.Include(convo => convo.Responsable).Include(convo => convo.ConvoType);
    private async Task<Convocatoria> RequireConvocatoriaAsync(int id) => await IncludeConvocatoria(database.Convocatorias).SingleOrDefaultAsync(item => item.Id == id) ?? throw new KeyNotFoundException("No se ha encontrado la convocatoria solicitada.");
    private async Task<ConvoType> RequireTypeAsync(int? id) => id.HasValue ? await database.ConvoTypes.FindAsync(id.Value) ?? throw new KeyNotFoundException("No existe el tipo de convocatoria indicado.") : throw new ArgumentException("El campo \"convoTypeId\" es obligatorio.");
    private async Task RequireUserAsync(int id) { if (!await database.Users.AnyAsync(user => user.Id == id)) throw new KeyNotFoundException("No existe el responsable indicado."); }
    private static void EnsureManager(Convocatoria convo, int userId, bool isAdmin) { if (!isAdmin && convo.ResponsableId != userId) throw new UnauthorizedAccessException(); }
    private static int NonNegative(int value, string field) => value < 0 ? throw new ArgumentException($"El campo \"{field}\" debe ser mayor o igual a 0.") : value;
    private static string Required(string? value, string field) => string.IsNullOrWhiteSpace(value) ? throw new ArgumentException($"El campo \"{field}\" es obligatorio.") : value.Trim();
    private static string? Optional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static bool HasField<T>(T _, string __) => false;
    private static object MapType(ConvoType type) => new { type.Id, type.Name, type.MinGrocSortida, type.MinVerdSortida, type.DefaultLocation };
    private static object MapConvocatoria(Convocatoria convo) => new { convo.Id, convo.Date, convo.Title, convo.UbiSortida, convo.ResponsableId, responsable = convo.Responsable is null ? null : new { convo.Responsable.Id, convo.Responsable.NCarnet, convo.Responsable.Name, convo.Responsable.LastName }, convo.ConvoTypeId, convo.ConvoType, convo.StartTime, convo.FinalTime, convo.ActualStartTime, convo.ActualEndTime, convo.IsActive, convo.AutoAssignResponsable, convo.Sortida, responseCount = 0 };
    private static object MapForm(CampaignForm form) => new { form.Id, form.ConvocatoriaId, form.ServiceMoment, form.Dia, form.ResponsableId, form.ResponsableNCarnet, form.CreatedByNCarnet, form.CreatedAt, form.UpdatedAt, voluntaris = JsonSerializer.Deserialize<object>(form.VoluntarisJson), vehicles = JsonSerializer.Deserialize<object>(form.VehiclesJson), convocatoria = form.Convocatoria is null ? null : new { form.Convocatoria.Id, form.Convocatoria.Title, form.Convocatoria.Date } };
    private async Task SaveAsync() { try { await database.SaveChangesAsync(); } catch (DbUpdateException error) { throw new InvalidOperationException("No se ha podido guardar el recurso.", error); } }
    private sealed record CampaignUser(int Id, string NCarnet, string Name, string? LastName);
}
