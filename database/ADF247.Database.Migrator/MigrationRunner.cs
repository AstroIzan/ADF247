using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Data.SqlClient;

namespace ADF247.Database.Migrator;

internal static class MigrationRunner
{
    private const string LockResource = "adf247-database-migrations";

    public static async Task RunAsync(string connectionString)
    {
        var migrations = LoadEmbeddedMigrations();

        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();

        await AcquireLockAsync(connection);
        try
        {
            await EnsureHistoryTableAsync(connection);
            await ImportPrismaHistoryAsync(connection);

            var applied = await GetAppliedAsync(connection);
            var pending = migrations.Where(migration => !applied.Contains(migration.Name)).ToList();

            if (pending.Count == 0)
            {
                Console.WriteLine("No hay migraciones pendientes.");
                return;
            }

            foreach (var migration in pending)
            {
                Console.WriteLine($"Aplicando {migration.Name}...");
                await ExecuteScriptAsync(connection, migration.Sql);
                await RecordAsync(connection, migration.Name, migration.Checksum);
                Console.WriteLine($"Aplicada {migration.Name}.");
            }

            Console.WriteLine($"{pending.Count} migracion(es) aplicadas.");
        }
        finally
        {
            await ReleaseLockAsync(connection);
        }
    }

    private static List<MigrationScript> LoadEmbeddedMigrations()
    {
        var assembly = Assembly.GetExecutingAssembly();
        var migrations = new List<MigrationScript>();

        foreach (var resource in assembly.GetManifestResourceNames())
        {
            var normalized = resource.Replace('\\', '/');
            if (!normalized.StartsWith("migrations/", StringComparison.Ordinal)
                || !normalized.EndsWith("/migration.sql", StringComparison.Ordinal))
            {
                continue;
            }

            var name = normalized["migrations/".Length..^"/migration.sql".Length];
            using var stream = assembly.GetManifestResourceStream(resource)!;
            using var reader = new StreamReader(stream, Encoding.UTF8);
            var sql = reader.ReadToEnd();
            var checksum = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(sql))).ToLowerInvariant();
            migrations.Add(new MigrationScript(name, sql, checksum));
        }

        if (migrations.Count == 0)
        {
            throw new InvalidOperationException("No se han encontrado migraciones incrustadas.");
        }

        return migrations.OrderBy(migration => migration.Name, StringComparer.Ordinal).ToList();
    }

    private static async Task AcquireLockAsync(SqlConnection connection)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            DECLARE @result INT;
            EXEC @result = sp_getapplock @Resource = @resource, @LockMode = 'Exclusive', @LockOwner = 'Session', @LockTimeout = 120000;
            SELECT @result;
            """;
        command.Parameters.AddWithValue("@resource", LockResource);

        var result = Convert.ToInt32(await command.ExecuteScalarAsync());
        if (result < 0)
        {
            throw new InvalidOperationException("No se pudo obtener el bloqueo de migraciones; hay otra migracion en curso.");
        }
    }

    private static async Task ReleaseLockAsync(SqlConnection connection)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = "EXEC sp_releaseapplock @Resource = @resource, @LockOwner = 'Session';";
        command.Parameters.AddWithValue("@resource", LockResource);
        await command.ExecuteNonQueryAsync();
    }

    private static async Task EnsureHistoryTableAsync(SqlConnection connection)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            IF OBJECT_ID(N'dbo.SchemaMigration', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.SchemaMigration (
                    name NVARCHAR(255) NOT NULL CONSTRAINT PK_SchemaMigration PRIMARY KEY,
                    checksum CHAR(64) NOT NULL,
                    appliedAt DATETIME2 NOT NULL CONSTRAINT DF_SchemaMigration_appliedAt DEFAULT SYSUTCDATETIME()
                );
            END
            """;
        await command.ExecuteNonQueryAsync();
    }

    // Las bases de datos existentes fueron migradas con Prisma: se reconocen sus migraciones completadas.
    private static async Task ImportPrismaHistoryAsync(SqlConnection connection)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            IF OBJECT_ID(N'dbo._prisma_migrations', N'U') IS NOT NULL
            BEGIN
                INSERT INTO dbo.SchemaMigration (name, checksum)
                SELECT p.migration_name, MIN(p.checksum)
                FROM dbo._prisma_migrations AS p
                WHERE p.finished_at IS NOT NULL
                  AND p.rolled_back_at IS NULL
                  AND NOT EXISTS (SELECT 1 FROM dbo.SchemaMigration AS s WHERE s.name = p.migration_name)
                GROUP BY p.migration_name;
            END
            """;
        var imported = await command.ExecuteNonQueryAsync();
        if (imported > 0)
        {
            Console.WriteLine($"Importadas {imported} migracion(es) del historial de Prisma.");
        }
    }

    private static async Task<HashSet<string>> GetAppliedAsync(SqlConnection connection)
    {
        var applied = new HashSet<string>(StringComparer.Ordinal);
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT name FROM dbo.SchemaMigration;";
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            applied.Add(reader.GetString(0));
        }

        return applied;
    }

    private static async Task ExecuteScriptAsync(SqlConnection connection, string sql)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.CommandTimeout = 0;
        await command.ExecuteNonQueryAsync();
    }

    private static async Task RecordAsync(SqlConnection connection, string name, string checksum)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = "INSERT INTO dbo.SchemaMigration (name, checksum) VALUES (@name, @checksum);";
        command.Parameters.AddWithValue("@name", name);
        command.Parameters.AddWithValue("@checksum", checksum);
        await command.ExecuteNonQueryAsync();
    }

    private sealed record MigrationScript(string Name, string Sql, string Checksum);
}
