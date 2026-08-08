const TelegramBot = require("node-telegram-bot-api");
const Parser = require("rss-parser");
const fs = require("fs");

const parser = new Parser();

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const CHANNEL_ID = "@football_news0U";

// ==========================================
// NEWS SOURCES
// ==========================================

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

// ==========================================
// PERSISTENT DUPLICATE PROTECTION
// ==========================================

const DATA_FILE = "./posted_articles.json";

let postedArticles = [];

try {
  if (fs.existsSync(DATA_FILE)) {
    postedArticles = JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8")
    );
  }
} catch (error) {
  console.log("⚠️ Could not load saved articles.");
}

function savePostedArticles() {
  try {
    // Keep only the latest 500 links
    postedArticles = postedArticles.slice(-500);

    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(postedArticles, null, 2)
    );
  } catch (error) {
    console.log("⚠️ Could not save articles.");
  }
}

// ==========================================
// START COMMAND
// ==========================================

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "📰 *Welcome to Daily Horizon!*\n\n" +
    "Your source for the latest news.\n\n" +
    "Choose a category:",
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

// ==========================================
// GET NEWS FOR USERS
// ==========================================

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

// ==========================================
// GET IMAGE
// ==========================================

function getImage(item) {

  if (
    item.enclosure &&
    item.enclosure.url &&
    item.enclosure.type &&
    item.enclosure.type.startsWith("image/")
  ) {
    return item.enclosure.url;
  }

  if (
    item.mediaContent &&
    item.mediaContent.url
  ) {
    return item.mediaContent.url;
  }

  if (
    item.mediaThumbnail &&
    item.mediaThumbnail.url
  ) {
    return item.mediaThumbnail.url;
  }

  return null;
}

// ==========================================
// POST AUTOMATIC NEWS
// ==========================================

async function postNewsToChannel(source) {

  try {

    console.log(`🔍 Checking ${source.name}...`);

    const feed = await parser.parseURL(source.url);

    if (!feed.items || feed.items.length === 0) {
      console.log("❌ No articles found.");
      return;
    }

    // Find an article we haven't posted
    const article = feed.items.find(
      item =>
        item.link &&
        !postedArticles.includes(item.link)
    );

    if (!article) {
      console.log(`⏭️ No new ${source.name} article.`);
      return;
    }

    const title =
      article.title || "Latest News";

    const link =
      article.link || "";

    const image =
      getImage(article);

    let description = "";

    if (article.contentSnippet) {
      description = article.contentSnippet
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 300);
    }

    const message =
      `📰 *DAILY HORIZON*\n\n` +
      `${source.name}\n\n` +
      `*${title}*\n\n` +
      `${description}\n\n` +
      `━━━━━━━━━━━━━━\n` +
      `🌍 Stay informed with Daily Horizon`;

    // ======================================
    // BUTTON
    // ======================================

    const options = {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔗 READ FULL STORY",
              url: link
            }
          ]
        ]
      }
    };

    // ======================================
    // SEND IMAGE OR TEXT
    // ======================================

    if (image) {

      try {

        await bot.sendPhoto(
          CHANNEL_ID,
          image,
          {
            caption: message,
            ...options
          }
        );

        console.log("🖼️ Image news posted.");

      } catch (imageError) {

        console.log(
          "⚠️ Image failed. Sending text..."
        );

        await bot.sendMessage(
          CHANNEL_ID,
          message,
          options
        );
      }

    } else {

      await bot.sendMessage(
        CHANNEL_ID,
        message,
        options
      );
    }

    // Save article as posted
    postedArticles.push(article.link);

    savePostedArticles();

    console.log(`✅ Posted: ${title}`);

  } catch (error) {

    console.error(
      "❌ Automatic news error:",
      error.message
    );
  }
}

// ==========================================
// ROTATION
// ==========================================

let currentSource = 0;

async function automaticNews() {

  const source =
    NEWS_SOURCES[currentSource];

  await postNewsToChannel(source);

  currentSource++;

  if (
    currentSource >= NEWS_SOURCES.length
  ) {
    currentSource = 0;
  }
}

// ==========================================
// START AUTOMATIC NEWS
// ==========================================

automaticNews();

// Every 30 minutes
setInterval(
  automaticNews,
  30 * 60 * 1000
);

// ==========================================
// BUTTONS
// ==========================================

bot.on("message", (msg) => {

  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text === "/start") {
    return;
  }

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

console.log(
  "🚀 Daily Horizon Bot is running..."
);
