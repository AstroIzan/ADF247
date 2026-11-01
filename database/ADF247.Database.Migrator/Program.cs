using ADF247.Database.Migrator;
using Microsoft.Data.SqlClient;

var command = args.FirstOrDefault()?.ToLowerInvariant() ?? "migrate";

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
        default:
            Console.Error.WriteLine("Uso: ADF247.Database.Migrator [migrate | seed-dev --confirm]");
            return 2;
    }

    return 0;
}
catch (Exception exception) when (exception is SqlException or InvalidOperationException)
{
    Console.Error.WriteLine($"ERROR: {exception.Message}");
    return 1;
}
