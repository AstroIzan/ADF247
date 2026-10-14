using ADF247.Batch.Worker;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddHostedService<BatchWorker>();

var host = builder.Build();
host.Run();
