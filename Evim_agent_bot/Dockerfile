
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY . .
RUN dotnet restore ./Evim_agent_bot/Evim_agent_bot.csproj
RUN dotnet publish ./Evim_agent_bot/Evim_agent_bot.csproj -c Release -o /app/out

FROM mcr.microsoft.com/dotnet/runtime:8.0 AS runtime
WORKDIR /app

ENV DOTNET_USE_POLLING_FILE_WATCHER=false

COPY --from=build /app/out .
ENTRYPOINT ["dotnet", "Evim_agent_bot.dll"]
