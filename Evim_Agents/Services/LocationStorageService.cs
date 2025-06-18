using System.Text.Json;
using YandexMapLibrary.Models;
using YandexMapLibrary.Models.YandexMapLibrary.Models;

namespace YandexMapLibrary.Services;

public class LocationStorageService
{
    private const string FilePath = "C:\\Users\\Zuc\\source\\repos\\Evim_Agents\\Evim_agent_bot\\wwwroot\\locations.json";

    public async Task SaveToJsonAsync(List<MarketLocation> locations)
    {
        var options = new JsonSerializerOptions { WriteIndented = true };
        var json = JsonSerializer.Serialize(locations, options);
        await File.WriteAllTextAsync(FilePath, json);
    }

    public async Task<List<MarketLocation>> LoadFromJsonAsync()
    {
        if (!File.Exists(FilePath))
            return new List<MarketLocation>();

        var json = await File.ReadAllTextAsync(FilePath);
        return JsonSerializer.Deserialize<List<MarketLocation>>(json) ?? new();
    }
}
