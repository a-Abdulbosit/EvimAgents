using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.FileProviders;
using Evim_agent_bot;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// 🔹 Serve files from wwwroot (index.html, locations.json, etc.)
app.UseDefaultFiles(); // enables default page like index.html
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")),
    RequestPath = ""
});

// 🔹 Start the Telegram bot
var botToken = "7112655258:AAGypb28Fosi0tgoe9LqOiZRY41Rm2fdaVk";
var botHandler = new TelegramBotHandler(botToken);
botHandler.Start();

// 🔹 Run the web server
app.Run(); // runs at http://localhost:5000 by default
