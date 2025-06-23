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
            ?? "Host=dpg-d19s7015pdvs73a52p50-a;Port=5432;Database=evim_db;Username=evim_db_user;Password=zs6QbkYpzIV7OJsK5hAfDmCHeINezK3a;SSL Mode=Require;Trust Server Certificate=true";
    }

    public async Task<List<MarketLocation>> GetAllLocationsAsync()
    {
        var list = new List<MarketLocation>();

        using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync();

        var sql = "SELECT * FROM market_locations";

        using var cmd = new NpgsqlCommand(sql, conn);
        using var reader = await cmd.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            list.Add(new MarketLocation
            {
                TelegramUserId = reader.GetInt64(reader.GetOrdinal("telegram_user_id")),
                AgentName = reader.GetString(reader.GetOrdinal("agent_name")),
                MarketNumber = reader.GetString(reader.GetOrdinal("market_number")),
                MarketName = reader.GetString(reader.GetOrdinal("market_name")),
                Notes = reader.IsDBNull(reader.GetOrdinal("notes")) ? null : reader.GetString(reader.GetOrdinal("notes")),
                Latitude = reader.GetDouble(reader.GetOrdinal("latitude")),
                Longitude = reader.GetDouble(reader.GetOrdinal("longitude")),
                CreatedAt = reader.GetDateTime(reader.GetOrdinal("created_at")),
                Status = (PartnerStatus)reader.GetInt32(reader.GetOrdinal("status")),
                ClientId = reader.IsDBNull(reader.GetOrdinal("client_id")) ? null : reader.GetInt64(reader.GetOrdinal("client_id")),
                TotalUsd = reader.IsDBNull(reader.GetOrdinal("total_usd")) ? null : reader.GetDecimal(reader.GetOrdinal("total_usd"))
            });
        }

        return list;
    }

    public async Task SaveLocationAsync(MarketLocation loc)
    {
        using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync();

        var sql = @"
            INSERT INTO market_locations (
                telegram_user_id, agent_name, market_number, market_name,
                notes, latitude, longitude, created_at, status, client_id, total_usd
            ) VALUES (
                @telegram_user_id, @agent_name, @market_number, @market_name,
                @notes, @latitude, @longitude, @created_at, @status, @client_id, @total_usd
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
        cmd.Parameters.AddWithValue("client_id", (object?)loc.ClientId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("total_usd", (object?)loc.TotalUsd ?? DBNull.Value);

        await cmd.ExecuteNonQueryAsync();
    }
}
