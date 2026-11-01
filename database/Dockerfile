FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY database/ADF247.Database.Migrator/ADF247.Database.Migrator.csproj database/ADF247.Database.Migrator/
RUN dotnet restore database/ADF247.Database.Migrator/ADF247.Database.Migrator.csproj

COPY database/ADF247.Database.Migrator database/ADF247.Database.Migrator
COPY database/migrations database/migrations
RUN dotnet publish database/ADF247.Database.Migrator/ADF247.Database.Migrator.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish

FROM mcr.microsoft.com/dotnet/runtime:10.0

WORKDIR /app
COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "ADF247.Database.Migrator.dll"]
CMD ["migrate"]
