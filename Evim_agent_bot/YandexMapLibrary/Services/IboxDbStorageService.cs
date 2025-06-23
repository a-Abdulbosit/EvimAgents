using Npgsql;
using System.Globalization;

public class MarketSyncService
{
    private readonly string _mainDbConnection;
    private readonly string _iboxDbConnection;
    private readonly decimal _exchangeRate = 12700m;

    public MarketSyncService(string mainDbConnection, string iboxDbConnection)
    {
        _mainDbConnection = mainDbConnection;
        _iboxDbConnection = iboxDbConnection;
    }

    public async Task SyncTotalsAsync()
    {
        using var mainConn = new NpgsqlConnection(_mainDbConnection);
        await mainConn.OpenAsync();

        var selectSql = "SELECT client_id, market_number FROM market_locations WHERE market_number IS NOT NULL";
        using var selectCmd = new NpgsqlCommand(selectSql, mainConn);
        using var reader = await selectCmd.ExecuteReaderAsync();

        var updates = new List<(long? ClientId, string Phone)>();

        while (await reader.ReadAsync())
        {
            var clientId = reader.IsDBNull(0) ? (long?)null : reader.GetInt64(0);
            var phone = reader.IsDBNull(1) ? null : reader.GetString(1);

            if (!string.IsNullOrWhiteSpace(phone))
                updates.Add((clientId, phone));
        }

        await reader.CloseAsync();

        foreach (var (clientId, phone) in updates)
        {
            try
            {
                long? iboxClientId = await GetIboxClientIdByPhoneAsync(phone);
                if (iboxClientId == null)
                    continue;

                var usdTotal = await GetUsdTotalFromSalesAsync(iboxClientId.Value);

                var updateSql = "UPDATE market_locations SET client_id = @client_id, total_usd = @usd WHERE market_number = @phone";

                using var updateCmd = new NpgsqlCommand(updateSql, mainConn);
                updateCmd.Parameters.AddWithValue("client_id", (object?)iboxClientId ?? DBNull.Value);
                updateCmd.Parameters.AddWithValue("usd", usdTotal);
                updateCmd.Parameters.AddWithValue("phone", phone);

                await updateCmd.ExecuteNonQueryAsync();

                Console.WriteLine($"Updated {phone}: ClientId={iboxClientId}, TotalUsd={usdTotal}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error syncing {phone}: {ex.Message}");
            }
        }
    }

    private async Task<long?> GetIboxClientIdByPhoneAsync(string phone)
    {
        try
        {
            using var conn = new NpgsqlConnection(_iboxDbConnection);
            await conn.OpenAsync();

            var sql = "SELECT id FROM clients WHERE phone_number = @phone LIMIT 1";

            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("phone", phone);

            var result = await cmd.ExecuteScalarAsync();
            return result is long id ? id : null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting client ID for {phone}: {ex.Message}");
            return null;
        }
    }

    private async Task<decimal> GetUsdTotalFromSalesAsync(long clientId)
    {
        try
        {
            using var conn = new NpgsqlConnection(_iboxDbConnection);
            await conn.OpenAsync();

            var sql = "SELECT price FROM sales_detailed WHERE outlet_id = @outlet_id";

            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("outlet_id", clientId);

            using var reader = await cmd.ExecuteReaderAsync();

            decimal total = 0;

            while (await reader.ReadAsync())
            {
                var raw = reader.GetString(0).Replace(",", ".").Trim();

                if (decimal.TryParse(raw, NumberStyles.Any, CultureInfo.InvariantCulture, out var amount))
                {
                    total += amount > 100 ? Math.Round(amount / _exchangeRate, 2) : amount;
                }
            }

            return Math.Round(total, 2);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting sales total for client {clientId}: {ex.Message}");
            return 0;
        }
    }
}
