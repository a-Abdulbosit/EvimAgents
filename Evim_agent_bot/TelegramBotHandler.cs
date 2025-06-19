using Evim_agent_bot.YandexMapLibrary.Models;
using Telegram.Bot.Polling;
using Telegram.Bot.Types.Enums;
using Telegram.Bot.Types.ReplyMarkups;
using Telegram.Bot.Types;
using Telegram.Bot;
using Evim_agent_bot.YandexMapLibrary.Services;

public class TelegramBotHandler
{
    private readonly LocationStorageService _storage = new();
    private readonly TelegramBotClient _botClient;
    private List<MarketLocation> _savedLocations = new();

    // Step: 1 = Name, 2 = Number, 3 = Notes, 4 = Status
    private readonly Dictionary<long, (MarketLocation Location, int Step)> _pendingLocations = new();

    public TelegramBotHandler(string token)
    {
        _botClient = new TelegramBotClient(token);
    }

    public async void Start()
    {
        var cts = new CancellationTokenSource();

        _savedLocations = await _storage.LoadFromJsonAsync();

        _botClient.StartReceiving(
            HandleUpdateAsync,
            HandleErrorAsync,
            new ReceiverOptions { AllowedUpdates = { } },
            cancellationToken: cts.Token
        );

        Console.WriteLine("✅ Бот запущен...");
        Console.ReadLine();
    }

    private async Task HandleUpdateAsync(ITelegramBotClient bot, Update update, CancellationToken ct)
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
        var userId = msg.From.Id;

        if (msg.Location != null)
        {
            var location = new MarketLocation
            {
                TelegramUserId = userId,
                AgentName = $"{msg.From.FirstName} {msg.From.LastName}".Trim(),
                Latitude = msg.Location.Latitude,
                Longitude = msg.Location.Longitude,
                CreatedAt = DateTime.UtcNow
            };

            _pendingLocations[userId] = (location, 1);
            await bot.SendTextMessageAsync(chatId, "📍 Локация получена!\nТеперь введите *название магазина*.");
            return;
        }

        if (_pendingLocations.TryGetValue(userId, out var session) && !string.IsNullOrWhiteSpace(msg.Text))
        {
            var (location, step) = session;
            string text = msg.Text.Trim();

            switch (step)
            {
                case 1:
                    location.MarketName = text;
                    _pendingLocations[userId] = (location, 2);
                    await bot.SendTextMessageAsync(chatId, "🔢 Введите *номер магазина*.");
                    break;

                case 2:
                    location.MarketNumber = text;
                    _pendingLocations[userId] = (location, 3);
                    await bot.SendTextMessageAsync(chatId, "📝 Есть ли *заметки*? Если нет — введите 'нет'.");
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

                    await bot.SendTextMessageAsync(chatId, "📌 Выберите *статус* партнёра:", replyMarkup: buttons);
                    break;
            }

            return;
        }

        if (msg.Text == "/start")
        {
            await bot.SendTextMessageAsync(chatId, "👋 Добро пожаловать!\nПожалуйста, отправьте свою *локацию*, чтобы начать метку магазина.");
        }
    }

    private async Task HandleCallbackQuery(ITelegramBotClient bot, CallbackQuery query)
    {
        var chatId = query.Message.Chat.Id;
        var userId = query.From.Id;

        if (!_pendingLocations.TryGetValue(userId, out var session))
            return;

        if (query.Data != null && query.Data.StartsWith("status_"))
        {
            var statusNum = int.Parse(query.Data.Replace("status_", ""));
            session.Location.Status = (PartnerStatus)statusNum;

            _savedLocations.Add(session.Location);
            _pendingLocations.Remove(userId);
            await _storage.SaveToJsonAsync(_savedLocations);

            await bot.SendTextMessageAsync(chatId,
                $"✅ Сохранено:\n🏪 {session.Location.MarketName} #{session.Location.MarketNumber}\n📍 ({session.Location.Latitude}, {session.Location.Longitude})\n🟢 Статус: {(PartnerStatus)statusNum}");

            await bot.SendTextMessageAsync(chatId, " https://8c40-84-54-94-37.ngrok-free.app");
            await bot.AnswerCallbackQueryAsync(query.Id);
        }
    }

    private Task HandleErrorAsync(ITelegramBotClient bot, Exception ex, CancellationToken ct)
    {
        Console.WriteLine($"❌ Ошибка: {ex.Message}");
        return Task.CompletedTask;
    }
}
