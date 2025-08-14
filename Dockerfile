# Stage 1: Build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy everything
COPY . .

# Restore dependencies
RUN dotnet restore ./Evim_agent_bot/Evim_agent_bot.csproj

# Publish the app
RUN dotnet publish ./Evim_agent_bot/Evim_agent_bot.csproj -c Release -o /app/out

# Stage 2: Run the app
FROM mcr.microsoft.com/dotnet/runtime:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .
ENTRYPOINT ["dotnet", "Evim_agent_bot.dll"]
