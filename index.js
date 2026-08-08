const TelegramBot = require("node-telegram-bot-api");
const Parser = require("rss-parser");

const parser = new Parser();

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

async function getNews(chatId, url) {
  try {
    const feed = await parser.parseURL(url);

    let message = "📰 *Latest Headlines*\n\n";

    feed.items.slice(0, 5).forEach((item, index) => {
      message += `${index + 1}. *${item.title}*\n${item.link}\n\n`;
    });

    bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      disable_web_page_preview: true
    });
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "❌ Unable to fetch news at the moment.");
  }
}

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "/start") return;

  switch (text) {
    case "🌍 World News":
      getNews(chatId, "https://feeds.bbci.co.uk/news/world/rss.xml");
      break;

    case "⚽ Football":
      getNews(chatId, "https://feeds.bbci.co.uk/sport/football/rss.xml");
      break;

    case "💰 Business":
      bot.sendMessage(chatId, "💰 Business news coming soon.");
      break;

    case "💻 Technology":
      bot.sendMessage(chatId, "💻 Technology news coming soon.");
      break;

    case "ℹ️ About":
      bot.sendMessage(
        chatId,
        "📰 Daily Horizon\nYour trusted news source on Telegram."
      );
      break;

    case "📢 Join Channel":
      bot.sendMessage(
        chatId,
        "Join our Telegram channel:\nhttps://t.me/football_news0U"
      );
      break;

    default:
      bot.sendMessage(
        chatId,
        "Please choose one of the buttons below."
      );
  }
});

console.log("Daily Horizon Bot is running...");
