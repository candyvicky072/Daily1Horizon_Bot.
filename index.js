const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

// Start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "👋 Welcome to Daily Horizon Bot!\n\nHow can I help you today?"
  );
});

// Auto replies
bot.on("message", (msg) => {
  const text = msg.text.toLowerCase();

  if (text === "/start") return;

  if (text === "hi" || text === "hello") {
    bot.sendMessage(msg.chat.id, "😊 Hello! Nice to meet you.");
  } else if (text === "how are you") {
    bot.sendMessage(msg.chat.id, "I'm doing great! Thanks for asking. 😊");
  } else if (text === "help") {
    bot.sendMessage(
      msg.chat.id,
      "Available commands:\n/start\nhelp\nnews\nabout"
    );
  } else if (text === "news") {
    bot.sendMessage(
      msg.chat.id,
      "📰 Daily Horizon will soon provide the latest news."
    );
  } else if (text === "about") {
    bot.sendMessage(
      msg.chat.id,
      "🤖 Daily Horizon Bot\nCreated to provide news and useful updates."
    );
  } else {
    bot.sendMessage(
      msg.chat.id,
      "❓ Sorry, I don't understand that. Type 'help' to see available commands."
    );
  }
});

console.log("Bot is running...");
