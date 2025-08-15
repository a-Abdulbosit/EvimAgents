using Evim_agent_bot.YandexMapLibrary.Models;
using Telegram.Bot.Polling;
using Telegram.Bot.Types.Enums;
using Telegram.Bot.Types.ReplyMarkups;
using Telegram.Bot.Types;
using Telegram.Bot;
using Evim_agent_bot.YandexMapLibrary.Services;

public class TelegramBotHandler
{
    private readonly TelegramBotClient _botClient;
    private readonly string _botToken; // Store your token here
    private readonly DbStorageService _dbStorage;

    // Step: 1 = Name, 2 = Number, 3 = Notes, 4 = Status, 5 = Photo
    private readonly Dictionary<long, (MarketLocation Location, int Step)> _pendingLocations = new();

    public TelegramBotHandler(string token, string connectionString)
    {
        _botToken = token;
        _botClient = new TelegramBotClient(token);
        _dbStorage = new DbStorageService(connectionString);
    }

    public async void Start()
    {
        var cts = new CancellationTokenSource();

        _botClient.StartReceiving(
            HandleUpdateAsync,
            HandleErrorAsync,
            new ReceiverOptions { AllowedUpdates = { } },
            cancellationToken: cts.Token
        );

        Console.WriteLine("✅ Бот запущен...");
    }

    private async Task HandleUpdateAsync(ITelegramBotClient bot, Update update, CancellationToken ct)
    {
        try
        {
            if (update.Type == UpdateType.CallbackQuery)
            {
                await HandleCallbackQuery(bot, update.CallbackQuery!);
                return;
            }

            if (update.Type != UpdateType.Message || update.Message == null)
                return;

            var msg = update.Message;
            var chatId = msg.Chat.Id;
            var userId = msg.From?.Id ?? 0;

            // Handle new location start
            if (msg.Location != null)
            {
                var location = new MarketLocation
                {
                    TelegramUserId = userId,
                    AgentName = $"{msg.From?.FirstName} {msg.From?.LastName}".Trim(),
                    Latitude = msg.Location.Latitude,
                    Longitude = msg.Location.Longitude,
                    CreatedAt = DateTime.UtcNow
                };

                _pendingLocations[userId] = (location, 1);
                await bot.SendTextMessageAsync(chatId, "📍 Локация получена!\nТеперь введите *название магазина*.", parseMode: ParseMode.Markdown);
                return;
            }

            // Handle step-based input
            if (_pendingLocations.TryGetValue(userId, out var session) && (!string.IsNullOrWhiteSpace(msg.Text) || msg.Photo != null))
            {
                var (location, step) = session;
                string text = msg.Text?.Trim() ?? "";

                switch (step)
                {
                    case 1:
                        location.MarketName = text;
                        _pendingLocations[userId] = (location, 2);
                        await bot.SendTextMessageAsync(chatId, "🔢 Введите *номер магазина*.", parseMode: ParseMode.Markdown);
                        break;

                    case 2:
                        location.MarketNumber = "+998" + text;
                        _pendingLocations[userId] = (location, 3);
                        await bot.SendTextMessageAsync(chatId, "📝 Есть ли *заметки*? Если нет — введите 'нет'.", parseMode: ParseMode.Markdown);
                        break;

                    case 3:
                        location.Notes = text.ToLower() == "нет" ? null : text;
                        _pendingLocations[userId] = (location, 4);

                        var buttons = new InlineKeyboardMarkup(new[]
                        {
                            new[]
                            {
                                InlineKeyboardButton.WithCallbackData("🕓 Новый", "status_0"),
                                InlineKeyboardButton.WithCallbackData("✅ Активный", "status_1"),
                                InlineKeyboardButton.WithCallbackData("❌ Неактивный", "status_2")
                            }
                        });

                        await bot.SendTextMessageAsync(chatId, "📌 Выберите *статус* партнёра:", replyMarkup: buttons, parseMode: ParseMode.Markdown);
                        break;

                    case 5: // Photo step
                        if (msg.Photo != null && msg.Photo.Any())
                        {
                            var fileId = msg.Photo.Last().FileId;

                            var file = await bot.GetFileAsync(fileId);

                            var fileUrl = $"https://api.telegram.org/file/bot{_botToken}/{file.FilePath}";

                            using var httpClient = new HttpClient();
                            var fileBytes = await httpClient.GetByteArrayAsync(fileUrl);

                            var uploadsPath = Path.Combine("wwwroot", "uploads");
                            if (!Directory.Exists(uploadsPath))
                            {
                                Directory.CreateDirectory(uploadsPath);
                            }
                            // Step 4: Save it locally (use unique filename to avoid overwrite)
                            var savePath = Path.Combine("wwwroot/uploads", $"{Guid.NewGuid()}.jpg");
                            await System.IO.File.WriteAllBytesAsync(savePath, fileBytes);

                            // Step 5: Store the local path or public URL instead of Telegram's temp link
                            location.PhotoUrl = $"/uploads/{Path.GetFileName(savePath)}";
                        }

                        else if (!string.IsNullOrWhiteSpace(text) && text.ToLower() == ".")
                        {
                            location.PhotoUrl = null;
                        }
                        else
                        {
                            await bot.SendTextMessageAsync(chatId, "❌ Пожалуйста, отправьте фото или напишите 'yoq'.");
                            return;
                        }

                        // Save to DB
                        _pendingLocations.Remove(userId);

                        try
                        {
                            await _dbStorage.SaveLocationAsync(location);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine("❌ DB Save Error: " + ex.Message);
                            await bot.SendTextMessageAsync(chatId, "❌ Ошибка при сохранении данных.");
                            return;
                        }

                        await bot.SendTextMessageAsync(chatId,
                            $"✅ Сохранено:\n🏪 {location.MarketName} #{location.MarketNumber}\n📍 ({location.Latitude}, {location.Longitude})\n🟢 Статус: {location.Status}");

                        await bot.SendTextMessageAsync(chatId, "🗺️ Посмотреть на карте: https://evimagents.onrender.com");
                        break;
                }

                return;
            }

            // Default start
            if (msg.Text == "/start")
            {
                await bot.SendTextMessageAsync(chatId, "👋 Добро пожаловать!\nПожалуйста, отправьте свою *локацию*, чтобы начать метку магазина.", parseMode: ParseMode.Markdown);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error in HandleUpdateAsync: {ex.Message}");
        }
    }

    private async Task HandleCallbackQuery(ITelegramBotClient bot, CallbackQuery query)
    {
        try
        {
            var chatId = query.Message?.Chat.Id ?? query.From.Id;
            var userId = query.From.Id;

            if (!_pendingLocations.TryGetValue(userId, out var session))
                return;

            if (query.Data != null && query.Data.StartsWith("status_"))
            {
                var statusNum = int.Parse(query.Data.Replace("status_", ""));
                session.Location.Status = (PartnerStatus)statusNum;

                // Move to photo step instead of saving immediately
                _pendingLocations[userId] = (session.Location, 5);

                await bot.SendTextMessageAsync(chatId, "📷 Отправьте фото магазина (или напишите 'нет').");
                await bot.AnswerCallbackQueryAsync(query.Id);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error in HandleCallbackQuery: {ex.Message}");
        }
    }

    private Task HandleErrorAsync(ITelegramBotClient bot, Exception ex, CancellationToken ct)
    {
        Console.WriteLine($"❌ Telegram Bot Error: {ex.Message}");
        return Task.CompletedTask;
    }
}
