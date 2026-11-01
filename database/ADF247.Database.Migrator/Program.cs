using ADF247.Database.Migrator;
using Microsoft.Data.SqlClient;

// Los despliegues antiguos invocaban el contenedor con argumentos de Prisma; cualquier comando desconocido equivale a migrate.
var command = args.FirstOrDefault()?.ToLowerInvariant() == "seed-dev" ? "seed-dev" : "migrate";

try
{
    var connectionString = ConnectionStringResolver.Resolve();

    switch (command)
    {
        case "migrate":
            await MigrationRunner.RunAsync(connectionString);
            break;
        case "seed-dev":
            if (!args.Contains("--confirm"))
            {
                Console.Error.WriteLine("seed-dev borra datos existentes. Repite el comando con --confirm para continuar.");
                return 2;
            }

            await MigrationRunner.RunAsync(connectionString);
            await DevSeeder.RunAsync(connectionString);
            break;
    }

    return 0;
}
catch (Exception exception) when (exception is SqlException or InvalidOperationException)
{
    Console.Error.WriteLine($"ERROR: {exception.Message}");
    return 1;
}
