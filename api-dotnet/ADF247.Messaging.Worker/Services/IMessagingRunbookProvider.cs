using ADF247.Messaging.Worker.Configuration;

namespace ADF247.Messaging.Worker.Services;

public interface IMessagingRunbookProvider
{
    MessagingRunbookSnapshot GetSnapshot();
}
