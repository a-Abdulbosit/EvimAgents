using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.FileProviders;
using Evim_agent_bot;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");

app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")),
    RequestPath = ""
});

var botToken = "7112655258:AAGypb28Fosi0tgoe9LqOiZRY41Rm2fdaVk"; // Don't expose token in public repos
var botHandler = new TelegramBotHandler(botToken, connectionString);
botHandler.Start();

app.Run();
