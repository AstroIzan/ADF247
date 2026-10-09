namespace ADF247.Messaging.Worker.Configuration;

public sealed class MessagingFirebaseOptions
{
    public const string SectionName = "MessagingFirebase";

    public string ServiceAccountPath { get; set; } = "/run/secrets/firebase-service-account.json";
}
