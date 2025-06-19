using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.FileProviders;
using Evim_agent_bot;
using Evim_agent_bot.YandexMapLibrary.Services;
using Microsoft.AspNetCore.Http;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// ✅ Load DB connection string from environment
var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");

// ✅ Serve static files (index.html, CSS, JS)
app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")),
    RequestPath = ""
});

// ✅ API endpoint: /locations.json returns DB data
app.MapGet("/locations.json", async () =>
{
    var db = new DbStorageService(connectionString);
    var locations = await db.GetAllLocationsAsync();

    return Results.Json(locations, new System.Text.Json.JsonSerializerOptions
    {
        PropertyNamingPolicy = null // Preserves PascalCase for frontend
    });
});

// ✅ Start Telegram bot
var botToken = Environment.GetEnvironmentVariable("TELEGRAM_BOT_TOKEN")
               ?? "7112655258:AAGypb28Fosi0tgoe9LqOiZRY41Rm2fdaVk"; // Optional fallback

var botHandler = new TelegramBotHandler(botToken, connectionString);
botHandler.Start();

// ✅ Run app
app.Run();
