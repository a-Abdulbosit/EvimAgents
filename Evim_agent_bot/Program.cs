using Evim_agent_bot;
using Evim_agent_bot.YandexMapLibrary.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using Npgsql;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING") 
    ?? "Host=dpg-d19s7015pdvs73a52p50-a;Port=5432;Database=evim_db;Username=evim_db_user;Password=zs6QbkYpzIV7OJsK5hAfDmCHeINezK3a;SSL Mode=Require;Trust Server Certificate=true";

var iboxConnectionString = "Host=95.182.117.158;Port=5432;Database=evim_db;Username=postgres;Password=9554";

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
app.MapPost("/mark-visited/{id:long}", async (long id) =>
{
    var db = new DbStorageService(Environment.GetEnvironmentVariable("DB_CONNECTION_STRING"));
    await db.MarkAsVisitedAsync(id);
    return Results.Ok();
});

// ✅ POST endpoint for syncing totals from ibox → main DB
app.MapPost("/sync", async () =>
{
    Console.WriteLine("🔄 Starting sync process...");
    var syncService = new MarketSyncService(connectionString, iboxConnectionString);
    await syncService.SyncTotalsAsync();
    Console.WriteLine("✅ Sync process completed");
    return Results.Ok("Synced all totals");
});
app.MapPost("/update-notes", async (UpdateNotesRequest request) =>
{
    try
    {
        using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();

        var sql = @"
            UPDATE market_locations 
            SET notes = @notes 
            WHERE telegram_user_id = @telegram_user_id 
            AND market_number = @market_number";

        using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("notes", (object?)request.Notes ?? DBNull.Value);
        cmd.Parameters.AddWithValue("telegram_user_id", request.TelegramUserId);
        cmd.Parameters.AddWithValue("market_number", request.MarketNumber);

        var rowsAffected = await cmd.ExecuteNonQueryAsync();

        if (rowsAffected == 0)
        {
            return Results.NotFound("Магазин не найден");
        }

        Console.WriteLine($"✅ Updated notes for shop {request.MarketNumber}: {request.Notes}");
        return Results.Ok(new { success = true, message = "Заметки успешно обновлены" });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error updating notes: {ex.Message}");
        return Results.Problem(
            detail: ex.Message,
            statusCode: 500,
            title: "Update Notes Error"
        );
    }
});
app.MapGet("/sync/{phone}", async (string phone) =>
{
    Console.WriteLine($"🔄 Testing sync for phone: {phone}");
    var syncService = new MarketSyncService(connectionString, iboxConnectionString);
    
    // Create a test sync for just this phone
    using var mainConn = new Npgsql.NpgsqlConnection(connectionString);
    await mainConn.OpenAsync();
    
    var selectSql = "SELECT client_id, market_number FROM market_locations WHERE market_number = @phone";
    using var selectCmd = new Npgsql.NpgsqlCommand(selectSql, mainConn);
    selectCmd.Parameters.AddWithValue("phone", phone);
    
    using var reader = await selectCmd.ExecuteReaderAsync();
    if (await reader.ReadAsync())
    {
        var clientId = reader.IsDBNull(0) ? (long?)null : reader.GetInt64(0);
        var phoneFromDb = reader.GetString(1);
        await reader.CloseAsync();
        
        Console.WriteLine($"📱 Found phone in database: {phoneFromDb}");
        
        // Test the sync for this specific phone
        await syncService.SyncTotalsAsync();
        
        return Results.Ok($"Tested sync for phone: {phone}");
    }
    else
    {
        return Results.NotFound($"Phone {phone} not found in database");
    }
});

// ✅ Start Telegram bot
var botToken = Environment.GetEnvironmentVariable("TELEGRAM_BOT_TOKEN")
               ?? "7112655258:AAGypb28Fosi0tgoe9LqOiZRY41Rm2fdaVk";

var botHandler = new TelegramBotHandler(botToken, connectionString);
botHandler.Start();

// ✅ Start the web app
app.Run();
public record UpdateNotesRequest(long TelegramUserId, string MarketNumber, string? Notes);