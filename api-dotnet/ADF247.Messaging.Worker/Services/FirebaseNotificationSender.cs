using ADF247.Messaging.Worker.Configuration;
using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Options;

namespace ADF247.Messaging.Worker.Services;

public sealed class FirebaseNotificationSender(
    IOptionsMonitor<MessagingFirebaseOptions> firebaseOptions) : IFirebaseNotificationSender
{
    private readonly object _sync = new();
    private FirebaseApp? _firebaseApp;

    public async Task<string> SendAsync(
        string token,
        string title,
        string body,
        IReadOnlyDictionary<string, string> data,
        CancellationToken cancellationToken)
    {
        _ = EnsureFirebaseApp();

        var message = new Message
        {
            Token = token,
            Notification = new Notification
            {
                Title = title,
                Body = body,
            },
            Data = data?.ToDictionary(pair => pair.Key, pair => pair.Value) ?? new Dictionary<string, string>(),
        };

        return await FirebaseMessaging.DefaultInstance.SendAsync(message, cancellationToken);
    }

    private FirebaseApp EnsureFirebaseApp()
    {
        if (_firebaseApp is not null)
        {
            return _firebaseApp;
        }

        lock (_sync)
        {
            if (_firebaseApp is not null)
            {
                return _firebaseApp;
            }

            if (FirebaseApp.DefaultInstance is not null)
            {
                _firebaseApp = FirebaseApp.DefaultInstance;
                return _firebaseApp;
            }

            var serviceAccountPath = firebaseOptions.CurrentValue.ServiceAccountPath;
            if (string.IsNullOrWhiteSpace(serviceAccountPath))
            {
                throw new InvalidOperationException("Firebase service account path is not configured.");
            }

            var resolvedPath = Path.GetFullPath(serviceAccountPath);
            if (!File.Exists(resolvedPath))
            {
                throw new InvalidOperationException($"Firebase service account file not found at '{resolvedPath}'.");
            }

            var credential = GoogleCredential.FromFile(resolvedPath);
            _firebaseApp = FirebaseApp.Create(new AppOptions
            {
                Credential = credential,
            });
            return _firebaseApp;
        }
    }
}
