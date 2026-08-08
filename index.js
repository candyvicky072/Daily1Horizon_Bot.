const TelegramBot = require("node-telegram-bot-api");
const Parser = require("rss-parser");

const parser = new Parser();

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const CHANNEL_ID = "@football_news0U";

// ======================================
// NEWS SOURCES
// ======================================

const NEWS_SOURCES = [
  {
    name: "🌍 WORLD NEWS",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml"
  },
  {
    name: "⚽ FOOTBALL",
    url: "https://feeds.bbci.co.uk/sport/football/rss.xml"
  },
  {
    name: "💻 TECHNOLOGY",
    url: "https://feeds.bbci.co.uk/news/technology/rss.xml"
  },
  {
    name: "💰 BUSINESS",
    url: "https://feeds.bbci.co.uk/news/business/rss.xml"
  }
];

// Remember articles already posted
const postedArticles = new Set();

// ======================================
// START COMMAND
// ======================================

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

// ======================================
// GET NEWS FOR USERS
// ======================================

async function getNews(chatId, url) {
  try {
    const feed = await parser.parseURL(url);

    let message = "📰 *Latest Headlines*\n\n";

    feed.items.slice(0, 5).forEach((item, index) => {
      message +=
        `${index + 1}. *${item.title}*\n` +
        `${item.link}\n\n`;
    });

    await bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      disable_web_page_preview: true
    });

  } catch (error) {
    console.error("News error:", error.message);

    await bot.sendMessage(
      chatId,
      "❌ Unable to fetch news at the moment."
    );
  }
}

// ======================================
// GET IMAGE FROM RSS ITEM
// ======================================

function getImage(item) {
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }

  if (item.mediaContent && item.mediaContent.url) {
    return item.mediaContent.url;
  }

  if (item.mediaThumbnail && item.mediaThumbnail.url) {
    return item.mediaThumbnail.url;
  }

  return null;
}

// ======================================
// AUTOMATIC CHANNEL POST
// ======================================

async function postNewsToChannel(source) {
  try {
    console.log(`🔍 Checking ${source.name}...`);

    const feed = await parser.parseURL(source.url);

    if (!feed.items || feed.items.length === 0) {
      console.log("❌ No articles found.");
      return;
    }

    // Find the first article we haven't posted
    const article = feed.items.find(
      item => item.link && !postedArticles.has(item.link)
    );

    if (!article) {
      console.log(`⏭️ No new ${source.name} article.`);
      return;
    }

    const title = article.title || "Latest News";
    const link = article.link || "";
    const image = getImage(article);

    let description = "";

    if (article.contentSnippet) {
      description = article.contentSnippet
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 250);
    }

    const message =
      `${source.name}\n\n` +
      `📰 *${title}*\n\n` +
      `${description ? description + "\n\n" : ""}` +
      `🔗 [Read Full Story](${link})\n\n` +
      `━━━━━━━━━━━━━━\n` +
      `📰 *Daily Horizon*\n` +
      `🌍 Your world. Your news.`;

    if (image) {
      try {
        await bot.sendPhoto(
          CHANNEL_ID,
          image,
          {
            caption: message,
            parse_mode: "Markdown"
          }
        );
      } catch (imageError) {
        console.log(
          "⚠️ Image failed, sending text instead..."
        );

        await bot.sendMessage(
          CHANNEL_ID,
          message,
          {
            parse_mode: "Markdown",
            disable_web_page_preview: false
          }
        );
      }
    } else {
      await bot.sendMessage(
        CHANNEL_ID,
        message,
        {
          parse_mode: "Markdown",
          disable_web_page_preview: false
        }
      );
    }

    postedArticles.add(link);

    console.log(`✅ Posted: ${title}`);

  } catch (error) {
    console.error(
      `❌ ${source.name} error:`,
      error.message
    );
  }
}

// ======================================
// ROTATE THROUGH NEWS CATEGORIES
// ======================================

let currentSource = 0;

async function automaticNews() {
  const source = NEWS_SOURCES[currentSource];

  await postNewsToChannel(source);

  currentSource++;

  if (currentSource >= NEWS_SOURCES.length) {
    currentSource = 0;
  }
}

// ======================================
// START AUTOMATIC POSTING
// ======================================

// Post immediately when Railway starts
automaticNews();

// Then post every 30 minutes
setInterval(
  automaticNews,
  30 * 60 * 1000
);

// ======================================
// BUTTONS
// ======================================

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text === "/start") return;

  switch (text) {

    case "🌍 World News":
      getNews(
        chatId,
        "https://feeds.bbci.co.uk/news/world/rss.xml"
      );
      break;

    case "⚽ Football":
      getNews(
        chatId,
        "https://feeds.bbci.co.uk/sport/football/rss.xml"
      );
      break;

    case "💰 Business":
      getNews(
        chatId,
        "https://feeds.bbci.co.uk/news/business/rss.xml"
      );
      break;

    case "💻 Technology":
      getNews(
        chatId,
        "https://feeds.bbci.co.uk/news/technology/rss.xml"
      );
      break;

    case "ℹ️ About":
      bot.sendMessage(
        chatId,
        "📰 Daily Horizon\n\n" +
        "Your trusted news source on Telegram."
      );
      break;

    case "📢 Join Channel":
      bot.sendMessage(
        chatId,
        "📢 Join Daily Horizon:\n" +
        "https://t.me/football_news0U"
      );
      break;

    default:
      bot.sendMessage(
        chatId,
        "Please choose one of the buttons below."
      );
  }
});

console.log("🚀 Daily Horizon Bot is running...");
