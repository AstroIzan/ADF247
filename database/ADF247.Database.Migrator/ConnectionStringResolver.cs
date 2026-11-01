namespace ADF247.Database.Migrator;

internal static class ConnectionStringResolver
{
    public static string Resolve()
    {
        var configured = Environment.GetEnvironmentVariable("ConnectionStrings__Adf247");
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return configured;
        }

        var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
        const string prefix = "sqlserver://";
        if (string.IsNullOrWhiteSpace(databaseUrl) || !databaseUrl.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Configura ConnectionStrings__Adf247 o DATABASE_URL (formato sqlserver://host:puerto;database=...;user=...;password=...).");
        }

        var segments = databaseUrl[prefix.Length..].Split(';', 2);
        var server = segments[0].Replace(":", ",", StringComparison.Ordinal);
        var properties = segments.Length == 2 ? segments[1] : string.Empty;
        properties = properties.Replace("user=", "User ID=", StringComparison.OrdinalIgnoreCase);

        return $"Server={server};{properties}";
    }
}
