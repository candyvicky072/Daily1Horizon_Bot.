const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "👋 Welcome to Daily Horizon Bot!\nChoose an option below:",
    {
      reply_markup: {
        keyboard: [
          ["📰 News", "ℹ️ About"],
          ["❓ Help", "👋 Hello"]
        ],
        resize_keyboard: true
      }
    }
  );
});

bot.on("message", (msg) => {
  const text = msg.text;

  if (text === "/start") return;

  switch (text) {
    case "👋 Hello":
      bot.sendMessage(msg.chat.id, "Hello! 😊 Welcome to Daily Horizon.");
      break;

    case "❓ Help":
      bot.sendMessage(
        msg.chat.id,
        "Use the buttons below to interact with me."
      );
      break;

    case "📰 News":
      bot.sendMessage(
        msg.chat.id,
        "📰 No news has been published yet. Stay tuned!"
      );
      break;

    case "ℹ️ About":
      bot.sendMessage(
        msg.chat.id,
        "🤖 Daily Horizon Bot\nVersion 1.0\nPowered by Railway."
      );
      break;

    default:
      bot.sendMessage(
        msg.chat.id,
        "Please use the buttons below."
      );
  }
});

console.log("Bot is running...");
