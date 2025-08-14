using Npgsql;
using Evim_agent_bot.YandexMapLibrary.Models;

namespace Evim_agent_bot.YandexMapLibrary.Services
{
    public class DbStorageService
    {
        private readonly string _connectionString;

        public DbStorageService(string connectionString)
        {
            _connectionString = connectionString;
        }

        public DbStorageService()
        {
            _connectionString = Environment.GetEnvironmentVariable("Host=95.182.117.158;Port=5432;Database=evimclients_db;Username=postgres;Password=9554")
                ?? "Host=95.182.117.158;Port=5432;Database=evimclients_db;Username=postgres;Password=9554";
        }

        public async Task MarkAsVisitedAsync(long id)
        {
            if (id == 0)
                throw new ArgumentException("ID cannot be zero", nameof(id));

            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            var sql = @"
                UPDATE market_locations 
                SET visited_at = @visitedAt 
                WHERE id = @id";

            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("visitedAt", DateTime.UtcNow);
            cmd.Parameters.AddWithValue("id", id);

            var rowsAffected = await cmd.ExecuteNonQueryAsync();

            if (rowsAffected == 0)
                throw new InvalidOperationException($"No market found with ID '{id}'");

            Console.WriteLine($"✅ Marked as visited: ID {id} ({rowsAffected} records updated)");
        }

        public async Task<List<MarketLocation>> GetAllLocationsAsync()
        {
            var list = new List<MarketLocation>();

            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            var sql = "SELECT * FROM market_locations ORDER BY created_at DESC";
            using var cmd = new NpgsqlCommand(sql, conn);
            using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                list.Add(new MarketLocation
                {
                    Id = reader.GetInt64(reader.GetOrdinal("id")),
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
                    TotalUsd = reader.IsDBNull(reader.GetOrdinal("total_usd")) ? null : reader.GetDecimal(reader.GetOrdinal("total_usd")),
                    VisitedAt = reader.IsDBNull(reader.GetOrdinal("visited_at")) ? null : reader.GetDateTime(reader.GetOrdinal("visited_at")),
                    PhotoUrl = reader.IsDBNull(reader.GetOrdinal("photo_url")) ? null : reader.GetString(reader.GetOrdinal("photo_url"))
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
                    notes, latitude, longitude, created_at, status, client_id, total_usd, visited_at, photo_url
                ) VALUES (
                    @telegram_user_id, @agent_name, @market_number, @market_name,
                    @notes, @latitude, @longitude, @created_at, @status, @client_id, @total_usd, @visited_at, @photo_url
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
            cmd.Parameters.AddWithValue("visited_at", (object?)loc.VisitedAt ?? DBNull.Value);
            cmd.Parameters.AddWithValue("photo_url", (object?)loc.PhotoUrl ?? DBNull.Value);

            await cmd.ExecuteNonQueryAsync();
        }
    }
}
