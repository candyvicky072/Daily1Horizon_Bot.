const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "👋 Hello! Welcome to Daily Horizon Bot."
  );
});

bot.on("message", (msg) => {
  if (msg.text !== "/start") {
    bot.sendMessage(msg.chat.id, `You said: ${msg.text}`);
  }
});

console.log("Bot is running...");
