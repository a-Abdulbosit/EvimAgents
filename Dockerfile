# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy everything
COPY . .

# Restore dependencies
RUN dotnet restore ./Evim_agent_bot/Evim_agent_bot.csproj

# Publish the app
RUN dotnet publish ./Evim_agent_bot/Evim_agent_bot.csproj -c Release -o /app/out

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copy published files from build stage
COPY --from=build /app/out .

# Render passes $PORT — use it to listen on all interfaces
ENV ASPNETCORE_URLS=http://0.0.0.0:${PORT}

# Run your app
ENTRYPOINT ["dotnet", "Evim_agent_bot.dll"]
