using Evim_agent_bot;
using Evim_agent_bot.YandexMapLibrary.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using System.Text.Json;

        var builder = WebApplication.CreateBuilder(args);

        var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");
        var iboxConnectionString = "Host=airnet;Port=5432;Database=evim_db;Username=friday;Password=3331";

        var app = builder.Build();

        // ✅ Serve index.html, styles.css, script.js from wwwroot
        app.UseDefaultFiles();
        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")),
            RequestPath = ""
        });

        // ✅ GET endpoint for frontend: returns market locations
        app.MapGet("/locations.json", async () =>
        {
            var db = new DbStorageService(connectionString);
            var locations = await db.GetAllLocationsAsync();

            return Results.Json(locations, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
        });

        // ✅ POST endpoint for syncing totals from ibox → main DB
        app.MapPost("/sync", async () =>
        {
            var syncService = new MarketSyncService(connectionString, iboxConnectionString);
            await syncService.SyncTotalsAsync();
            return Results.Ok("Synced all totals");
        });

        // ✅ Start Telegram bot
        var botToken = Environment.GetEnvironmentVariable("TELEGRAM_BOT_TOKEN")
                       ?? "7112655258:AAGypb28Fosi0tgoe9LqOiZRY41Rm2fdaVk";

        var botHandler = new TelegramBotHandler(botToken, connectionString);
        botHandler.Start();

        // ✅ Start the web app
        app.Run();
