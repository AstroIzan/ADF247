FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY ADF247.Api/ADF247.Api.csproj ADF247.Api/
RUN dotnet restore ADF247.Api/ADF247.Api.csproj

COPY . .
RUN dotnet publish ADF247.Api/ADF247.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0

WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "ADF247.Api.dll"]
