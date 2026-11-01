using BCrypt.Net;
using Microsoft.Data.SqlClient;

namespace ADF247.Database.Migrator;

// Datos de ejemplo solo para desarrollo: elimina usuarios, convocatorias y respuestas existentes.
internal static class DevSeeder
{
    private static readonly SeedUser[] Users =
    [
        new("CapOperatiu", null, "247/GI/200", "S10", "Airline1", true, false, true, true),
        new("CapDeColla", null, "247/GI/215", "S20", "Airline2", false, true, true, true),
        new("GrocAdmin", null, "247/GI/225", null, "Airline3", false, false, true, true),
        new("GrocNoAdmin", null, "247/GI/230", null, "Airline4", false, false, false, true),
        new("VerdAdmin", null, "247/068", null, "Airline5", false, false, true, false),
        new("VerdNoAdmin", null, "247/070", null, "Airline6", false, false, false, false),
        new("Izan", "Estirado Alfaro", "247/GI/239", null, "Airline7", false, false, false, true),
        new("Bru", "Carreras Hernandez", "247/069", null, "Airline8", false, false, false, false),
    ];

    private static readonly SeedConvoType[] ConvoTypes =
    [
        new("Guardia", 2, 4, "brigadas"),
        new("PVI", 2, 4, "brigadas"),
        new("Semanal", 0, 0, "base"),
        new("Formacion", 0, 0, "base"),
        new("Incendi", 3, 6, "Sabadell"),
    ];

    private static readonly SeedConvo[] Convos =
    [
        new("Guardia", "2026-02-23T12:00", "2026-02-23T16:00", "brigadas", "247/GI/200"),
        new("Guardia", "2026-02-23T16:00", "2026-02-23T20:00", "brigadas", "247/GI/239"),
        new("PVI", "2026-02-24T10:00", "2026-02-24T14:00", "brigadas", "247/GI/215"),
        new("Formacion", "2026-02-26T09:00", null, "base", "247/GI/215"),
        new("Incendi", "2026-02-21T17:10", null, "Sabadell", "247/GI/225"),
        new("Guardia", "2026-03-20T09:00", "2026-03-20T13:00", "brigadas", "247/GI/200"),
        new("Formacion", "2026-03-20T15:00", "2026-03-20T18:00", "base", "247/GI/215"),
        new("Semanal", "2026-03-22T10:00", "2026-03-22T14:00", "base", "247/GI/225"),
        new("Guardia", "2026-03-25T12:00", null, "brigadas", "247/GI/239"),
    ];

    private static readonly SeedWindow[] Windows =
    [
        new("247/GI/239", "2026-03-25T11:00", "2026-03-25T14:00", "available", "manual", "Disponible para turno de mediodia"),
        new("247/GI/230", "2026-03-25T10:30", "2026-03-25T16:00", "unavailable", "manual", "No disponible por trabajo"),
        new("247/069", "2026-03-25T11:30", "2026-03-25T13:30", "available", "import", "Importado desde planilla"),
    ];

    public static async Task RunAsync(string connectionString)
    {
        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync();

        foreach (var table in new[] { "FormulariCampanya", "UserHoursSummary", "AvailabilityWindow", "Respuesta", "Convocatoria", "Role", "User", "ConvoType" })
        {
            await ExecuteAsync(connection, transaction, $"DELETE FROM dbo.[{table}];");
        }

        foreach (var user in Users)
        {
            await ExecuteAsync(connection, transaction, """
                INSERT INTO dbo.[User] (nCarnet, nIndicatiu, name, lastName, password, isActive, updatedAt)
                VALUES (@nCarnet, @nIndicatiu, @name, @lastName, @password, 1, SYSUTCDATETIME());
                INSERT INTO dbo.[Role] (nCarnet, isCapOperatiu, isCapColla, isAdmin, isGroc)
                VALUES (@nCarnet, @isCapOperatiu, @isCapColla, @isAdmin, @isGroc);
                """,
                ("@nCarnet", user.NCarnet),
                ("@nIndicatiu", user.NIndicatiu),
                ("@name", user.Name),
                ("@lastName", user.LastName),
                ("@password", BCrypt.Net.BCrypt.HashPassword(user.Password, 10)),
                ("@isCapOperatiu", user.IsCapOperatiu),
                ("@isCapColla", user.IsCapColla),
                ("@isAdmin", user.IsAdmin),
                ("@isGroc", user.IsGroc));
            Console.WriteLine($"Usuario creado: {user.Name} ({user.NCarnet}) - Pass: {user.Password}");
        }

        foreach (var type in ConvoTypes)
        {
            await ExecuteAsync(connection, transaction, """
                INSERT INTO dbo.ConvoType (name, minGrocSortida, minVerdSortida, defaultLocation)
                VALUES (@name, @minGroc, @minVerd, @location);
                """,
                ("@name", type.Name), ("@minGroc", type.MinGroc), ("@minVerd", type.MinVerd), ("@location", type.Location));
        }

        foreach (var convo in Convos)
        {
            var start = DateTime.Parse(convo.Start);
            await ExecuteAsync(connection, transaction, """
                INSERT INTO dbo.Convocatoria (date, title, ubiSortida, responsableId, convoTypeId, startTime, finalTime, isActive)
                SELECT @date, @title, @location, u.id, t.id, @start, @final, 1
                FROM dbo.ConvoType AS t, dbo.[User] AS u
                WHERE t.name = @type AND u.nCarnet = @responsable;
                """,
                ("@date", start.Date),
                ("@title", $"{convo.Type} - {start:dd/MM/yyyy}"),
                ("@location", convo.Location),
                ("@start", start),
                ("@final", convo.Final is null ? null : DateTime.Parse(convo.Final)),
                ("@type", convo.Type),
                ("@responsable", convo.Responsable));
        }

        foreach (var window in Windows)
        {
            await ExecuteAsync(connection, transaction, """
                INSERT INTO dbo.AvailabilityWindow (userNCarnet, fromDateTime, toDateTime, availabilityType, source, notes, updatedAt)
                VALUES (@user, @from, @to, @type, @source, @notes, SYSUTCDATETIME());
                """,
                ("@user", window.User), ("@from", DateTime.Parse(window.From)), ("@to", DateTime.Parse(window.To)),
                ("@type", window.Type), ("@source", window.Source), ("@notes", window.Notes));
        }

        await transaction.CommitAsync();
        Console.WriteLine("Seed de desarrollo completado.");
    }

    private static async Task ExecuteAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        string sql,
        params (string Name, object? Value)[] parameters)
    {
        await using var command = new SqlCommand(sql, connection, transaction);
        foreach (var (name, value) in parameters)
        {
            command.Parameters.AddWithValue(name, value ?? DBNull.Value);
        }

        await command.ExecuteNonQueryAsync();
    }

    private sealed record SeedUser(
        string Name, string? LastName, string NCarnet, string? NIndicatiu, string Password,
        bool IsCapOperatiu, bool IsCapColla, bool IsAdmin, bool IsGroc);

    private sealed record SeedConvoType(string Name, int MinGroc, int MinVerd, string Location);

    private sealed record SeedConvo(string Type, string Start, string? Final, string Location, string Responsable);

    private sealed record SeedWindow(string User, string From, string To, string Type, string Source, string Notes);
}
