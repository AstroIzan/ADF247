namespace ADF247.Messaging.Worker.Configuration;

public sealed class MessagingRunbookOptions
{
    public const string SectionName = "MessagingRunbook";

    public List<CampaignDefinition> Campaigns { get; set; } = [];
}

public sealed class CampaignDefinition
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Cron { get; set; } = string.Empty;
    public string Channel { get; set; } = "firebase";
    public string Template { get; set; } = string.Empty;
    public bool Enabled { get; set; } = true;
}
