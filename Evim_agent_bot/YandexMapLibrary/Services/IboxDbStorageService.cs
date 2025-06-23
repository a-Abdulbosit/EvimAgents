using Npgsql;
using System.Globalization;
using System.Text.RegularExpressions;

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
                {
                    Console.WriteLine($"❌ Client not found for phone: {phone}");
                    continue;
                }

                var usdTotal = await GetUsdTotalFromSalesAsync(iboxClientId.Value);

                var updateSql = "UPDATE market_locations SET client_id = @client_id, total_usd = @usd WHERE market_number = @phone";

                using var updateCmd = new NpgsqlCommand(updateSql, mainConn);
                updateCmd.Parameters.AddWithValue("client_id", (object?)iboxClientId ?? DBNull.Value);
                updateCmd.Parameters.AddWithValue("usd", usdTotal);
                updateCmd.Parameters.AddWithValue("phone", phone);

                await updateCmd.ExecuteNonQueryAsync();

                Console.WriteLine($"✅ Updated {phone}: ClientId={iboxClientId}, TotalUsd={usdTotal}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error syncing {phone}: {ex.Message}");
            }
        }
    }
    private async Task<long?> GetIboxClientIdByPhoneAsync(string phone)
    {
        try
        {
            using var conn = new NpgsqlConnection(_iboxDbConnection);
            await conn.OpenAsync();

            // Normalize phone number - remove all non-digits
            var normalizedPhone = Regex.Replace(phone, @"[^\d]", "");

            // Try different phone number formats
            var phoneFormats = new List<string>();

            // Original phone
            phoneFormats.Add(phone);

            // With + prefix
            if (!phone.StartsWith("+"))
                phoneFormats.Add("+" + phone);

            // Without + prefix
            if (phone.StartsWith("+"))
                phoneFormats.Add(phone.Substring(1));

            // Normalized version
            phoneFormats.Add(normalizedPhone);

            // With +998 prefix if it's missing
            if (normalizedPhone.Length == 9 && !normalizedPhone.StartsWith("998"))
                phoneFormats.Add("+998" + normalizedPhone);

            // Without country code if it has one
            if (normalizedPhone.StartsWith("998") && normalizedPhone.Length == 12)
                phoneFormats.Add(normalizedPhone.Substring(3));

            foreach (var phoneFormat in phoneFormats.Distinct())
            {
                // Try contacts column first
                var sql = "SELECT id FROM clients WHERE contacts = @phone LIMIT 1";
                using var cmd = new NpgsqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("phone", phoneFormat);

                var result = await cmd.ExecuteScalarAsync();
                if (result is long id)
                {
                    Console.WriteLine($"✅ Found client ID {id} for phone {phoneFormat} in contacts column");
                    return id;
                }

                // Try phone_number column
                sql = "SELECT id FROM clients WHERE phone_number = @phone LIMIT 1";
                cmd.CommandText = sql;
                cmd.Parameters.Clear();
                cmd.Parameters.AddWithValue("phone", phoneFormat);

                result = await cmd.ExecuteScalarAsync();
                if (result is long id2)
                {
                    Console.WriteLine($"✅ Found client ID {id2} for phone {phoneFormat} in phone_number column");
                    return id2;
                }

                // Try with LIKE for partial matches
                sql = "SELECT id FROM clients WHERE contacts LIKE @phone OR phone_number LIKE @phone LIMIT 1";
                cmd.CommandText = sql;
                cmd.Parameters.Clear();
                cmd.Parameters.AddWithValue("phone", "%" + phoneFormat + "%");

                result = await cmd.ExecuteScalarAsync();
                if (result is long id3)
                {
                    Console.WriteLine($"✅ Found client ID {id3} for phone {phoneFormat} with LIKE search");
                    return id3;
                }
            }

            Console.WriteLine($"❌ No client found for phone: {phone} (tried formats: {string.Join(", ", phoneFormats)})");
            return null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error getting client ID for {phone}: {ex.Message}");
            return null;
        }
    }

    private async Task<decimal> GetUsdTotalFromSalesAsync(long clientId)
    {
        try
        {
            using var conn = new NpgsqlConnection(_iboxDbConnection);
            await conn.OpenAsync();

            const string sql = "SELECT total FROM sales_detailed WHERE outlet_id = @outlet_id";
            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("outlet_id", clientId);

            using var reader = await cmd.ExecuteReaderAsync();

            decimal totalUsd = 0;
            int recordCount = 0;

            while (await reader.ReadAsync())
            {
                recordCount++;

                var raw = reader.IsDBNull(0) ? null : reader.GetString(0)?.Replace(",", ".").Trim();
                if (string.IsNullOrWhiteSpace(raw))
                {
                    Console.WriteLine("   ⚠️ Skipping empty total value.");
                    continue;
                }

                if (decimal.TryParse(raw, NumberStyles.Any, CultureInfo.InvariantCulture, out var amount))
                {
                    decimal usdAmount = amount > 100 ? Math.Round(amount / _exchangeRate, 2) : amount;
                    totalUsd += usdAmount;
                    Console.WriteLine($"   Sale record #{recordCount}: {raw} => ${usdAmount}");
                }
                else
                {
                    Console.WriteLine($"   ⚠️ Invalid number format in record #{recordCount}: {raw}");
                }
            }

            Console.WriteLine($"   📊 Final USD Total from {recordCount} records: ${Math.Round(totalUsd, 2)}");
            return Math.Round(totalUsd, 2);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error retrieving sales for client {clientId}: {ex.Message}");
            return 0;
        }
    }

}
