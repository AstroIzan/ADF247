FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY ADF247.Messaging.Worker/ADF247.Messaging.Worker.csproj ADF247.Messaging.Worker/
RUN dotnet restore ADF247.Messaging.Worker/ADF247.Messaging.Worker.csproj

COPY . .
RUN dotnet publish ADF247.Messaging.Worker/ADF247.Messaging.Worker.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish

FROM mcr.microsoft.com/dotnet/runtime:10.0

WORKDIR /app
COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "ADF247.Messaging.Worker.dll"]
