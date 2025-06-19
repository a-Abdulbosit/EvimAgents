using Npgsql;
using Evim_agent_bot.YandexMapLibrary.Models;

namespace Evim_agent_bot.YandexMapLibrary.Services;
public class DbStorageService
{
    private readonly string _connectionString;

    public DbStorageService(string connectionString)
    {
        _connectionString = connectionString;
    }

    public DbStorageService()
    {
        _connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
            ?? throw new Exception("DB_CONNECTION_STRING is not set.");
    }
    public async Task SaveLocationAsync(MarketLocation loc)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync();

        var sql = @"
            INSERT INTO market_locations (
                telegram_user_id, agent_name, market_number, market_name,
                notes, latitude, longitude, created_at, status
            ) VALUES (
                @telegram_user_id, @agent_name, @market_number, @market_name,
                @notes, @latitude, @longitude, @created_at, @status
            )";

        using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("telegram_user_id", loc.TelegramUserId);
        cmd.Parameters.AddWithValue("agent_name", loc.AgentName);
        cmd.Parameters.AddWithValue("market_number", loc.MarketNumber);
        cmd.Parameters.AddWithValue("market_name", loc.MarketName);
        cmd.Parameters.AddWithValue("notes", (object?)loc.Notes ?? DBNull.Value);
        cmd.Parameters.AddWithValue("latitude", loc.Latitude);
        cmd.Parameters.AddWithValue("longitude", loc.Longitude);
        cmd.Parameters.AddWithValue("created_at", loc.CreatedAt);
        cmd.Parameters.AddWithValue("status", (int)loc.Status);

        await cmd.ExecuteNonQueryAsync();
    }
}
