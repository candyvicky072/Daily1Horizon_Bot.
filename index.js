const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "📰 *Welcome to Daily Horizon!*\n\nYour source for the latest news.\nChoose a category:",
    {
      parse_mode: "Markdown",
      reply_markup: {
        keyboard: [
          ["🌍 World News", "⚽ Football"],
          ["💰 Business", "💻 Technology"],
          ["ℹ️ About", "📢 Join Channel"]
        ],
        resize_keyboard: true
      }
    }
  );
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "/start") return;

  switch (text) {
    case "🌍 World News":
      bot.sendMessage(chatId, "🌍 World news updates will appear here soon.");
      break;

    case "⚽ Football":
      bot.sendMessage(chatId, "⚽ Latest football news coming soon.");
      break;

    case "💰 Business":
      bot.sendMessage(chatId, "💰 Business and market updates coming soon.");
      break;

    case "💻 Technology":
      bot.sendMessage(chatId, "💻 Technology news coming soon.");
      break;

    case "ℹ️ About":
      bot.sendMessage(chatId, "📰 Daily Horizon\nYour trusted news source on Telegram.");
      break;

    case "📢 Join Channel":
      bot.sendMessage(
        chatId,
        "Join our Telegram channel:\nhttps://t.me/YOUR_CHANNEL_USERNAME"
      );
      break;

    default:
      bot.sendMessage(chatId, "Please choose one of the buttons below.");
  }
});

console.log("Daily Horizon Bot is running...");
