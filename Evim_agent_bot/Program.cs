using Evim_agent_bot.YandexMapLibrary.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using System.Text.Json;

public static partial class Program
{
    private static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");
        var iboxConnectionString = "Host=airnet;Port=5432;Database=evim_db;Username=friday;Password=3331";

        var app = builder.Build();

        app.UseDefaultFiles();
        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")),
            RequestPath = ""
        });

        // ✅ Serve map data
        app.MapGet("/locations.json", async () =>
        {
            var db = new DbStorageService(connectionString);
            var locations = await db.GetAllLocationsAsync();

            return Results.Json(locations, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
        });

        // ✅ Sync totals from ibox DB
        app.MapPost("/sync", async () =>
        {
            var syncService = new MarketSyncService(connectionString, iboxConnectionString);
            await syncService.SyncTotalsAsync();
            return Results.Ok("Synced all totals");
        });

        var botToken = Environment.GetEnvironmentVariable("TELEGRAM_BOT_TOKEN")
                       ?? "your_fallback_token_here";

        var botHandler = new TelegramBotHandler(botToken, connectionString);
        botHandler.Start();

        app.Run();
    }
}
