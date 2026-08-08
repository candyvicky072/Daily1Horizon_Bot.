const TelegramBot = require("node-telegram-bot-api");
const Parser = require("rss-parser");
const fs = require("fs");

const parser = new Parser();

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const CHANNEL_ID = "@football_news0U";

// ==========================================
// ADMIN
// ==========================================

const ADMIN_ID = 8432370237;

let autoPosting = true;

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
// DUPLICATE PROTECTION
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
          ["🔎 Search News", "ℹ️ About"],
          ["📢 Join Channel"]
        ],
        resize_keyboard: true
      }
    }
  );
});

// ==========================================
// ADMIN CHECK
// ==========================================

function isAdmin(msg) {
  return msg.from && msg.from.id === ADMIN_ID;
}

// ==========================================
// ADMIN PANEL
// ==========================================

bot.onText(/\/admin/, (msg) => {

  if (!isAdmin(msg)) {
    bot.sendMessage(
      msg.chat.id,
      "❌ You are not authorized to use admin commands."
    );
    return;
  }

  bot.sendMessage(
    msg.chat.id,
    "🔐 *Daily Horizon Admin Panel*\n\n" +
    "📢 /post - Post next news now\n" +
    "📊 /status - Check bot status\n" +
    "📰 /sources - View news sources\n" +
    "⏸️ /stop - Stop automatic posting\n" +
    "▶️ /resume - Resume automatic posting",
    {
      parse_mode: "Markdown"
    }
  );
});

// ==========================================
// ADMIN: POST NOW
// ==========================================

bot.onText(/\/post/, async (msg) => {

  if (!isAdmin(msg)) {
    bot.sendMessage(
      msg.chat.id,
      "❌ You are not authorized."
    );
    return;
  }

  bot.sendMessage(
    msg.chat.id,
    "📰 Finding the latest news..."
  );

  await automaticNews();

  bot.sendMessage(
    msg.chat.id,
    "✅ News posting process completed."
  );
});

// ==========================================
// ADMIN: STATUS
// ==========================================

bot.onText(/\/status/, (msg) => {

  if (!isAdmin(msg)) {
    bot.sendMessage(
      msg.chat.id,
      "❌ You are not authorized."
    );
    return;
  }

  bot.sendMessage(
    msg.chat.id,
    "📊 *Daily Horizon Status*\n\n" +
    "🤖 Bot: Online\n" +
    `📢 Channel: ${CHANNEL_ID}\n` +
    `⏰ Automatic posting: ${
      autoPosting ? "ON ✅" : "OFF ⏸️"
    }\n` +
    `📰 Saved articles: ${postedArticles.length}`,
    {
      parse_mode: "Markdown"
    }
  );
});

// ==========================================
// ADMIN: SOURCES
// ==========================================

bot.onText(/\/sources/, (msg) => {

  if (!isAdmin(msg)) {
    bot.sendMessage(
      msg.chat.id,
      "❌ You are not authorized."
    );
    return;
  }

  let message =
    "📰 *Daily Horizon Sources*\n\n";

  NEWS_SOURCES.forEach((source, index) => {
    message +=
      `${index + 1}. ${source.name}\n`;
  });

  bot.sendMessage(
    msg.chat.id,
    message,
    {
      parse_mode: "Markdown"
    }
  );
});

// ==========================================
// ADMIN: STOP
// ==========================================

bot.onText(/\/stop/, (msg) => {

  if (!isAdmin(msg)) {
    bot.sendMessage(
      msg.chat.id,
      "❌ You are not authorized."
    );
    return;
  }

  autoPosting = false;

  bot.sendMessage(
    msg.chat.id,
    "⏸️ Automatic news posting has been stopped."
  );
});

// ==========================================
// ADMIN: RESUME
// ==========================================

bot.onText(/\/resume/, (msg) => {

  if (!isAdmin(msg)) {
    bot.sendMessage(
      msg.chat.id,
      "❌ You are not authorized."
    );
    return;
  }

  autoPosting = true;

  bot.sendMessage(
    msg.chat.id,
    "▶️ Automatic news posting has been resumed."
  );
});

// ==========================================
// GET NEWS
// ==========================================

async function getNews(chatId, url) {

  try {

    const feed =
      await parser.parseURL(url);

    let message =
      "📰 *Latest Headlines*\n\n";

    feed.items
      .slice(0, 5)
      .forEach((item, index) => {

        message +=
          `${index + 1}. *${item.title}*\n` +
          `${item.link}\n\n`;
      });

    await bot.sendMessage(
      chatId,
      message,
      {
        parse_mode: "Markdown",
        disable_web_page_preview: true
      }
    );

  } catch (error) {

    console.error(
      "News error:",
      error.message
    );

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
// POST NEWS TO CHANNEL
// ==========================================

async function postNewsToChannel(source) {

  try {

    console.log(
      `🔍 Checking ${source.name}...`
    );

    const feed =
      await parser.parseURL(source.url);

    if (
      !feed.items ||
      feed.items.length === 0
    ) {
      console.log(
        "❌ No articles found."
      );
      return;
    }

    const article =
      feed.items.find(
        item =>
          item.link &&
          !postedArticles.includes(
            item.link
          )
      );

    if (!article) {

      console.log(
        `⏭️ No new ${source.name} article.`
      );

      return;
    }

    const title =
      article.title ||
      "Latest News";

    const link =
      article.link ||
      "";

    const image =
      getImage(article);

    let description = "";

    if (article.contentSnippet) {

      description =
        article.contentSnippet
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

        console.log(
          "🖼️ Image news posted."
        );

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

    postedArticles.push(
      article.link
    );

    savePostedArticles();

    console.log(
      `✅ Posted: ${title}`
    );

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

  if (!autoPosting) {
    console.log(
      "⏸️ Automatic posting is OFF."
    );
    return;
  }

  const source =
    NEWS_SOURCES[currentSource];

  await postNewsToChannel(source);

  currentSource++;

  if (
    currentSource >=
    NEWS_SOURCES.length
  ) {
    currentSource = 0;
  }
}

// ==========================================
// START AUTOMATIC POSTING
// ==========================================

automaticNews();

setInterval(
  automaticNews,
  30 * 60 * 1000
);

// ==========================================
// NEWS SEARCH
// ==========================================

bot.onText(
  /\/search(?:\s+(.+))?/i,
  async (msg, match) => {

    const chatId = msg.chat.id;
    const keyword = match[1];

    if (!keyword) {

      await bot.sendMessage(
        chatId,
        "🔎 *News Search*\n\n" +
        "Use the command like this:\n\n" +
        "`/search Messi`\n" +
        "`/search Nigeria`\n" +
        "`/search Bitcoin`",
        {
          parse_mode: "Markdown"
        }
      );

      return;
    }

    await bot.sendMessage(
      chatId,
      `🔍 Searching news for *${keyword}*...`,
      {
        parse_mode: "Markdown"
      }
    );

    try {

      let results = [];

      for (const source of NEWS_SOURCES) {

        try {

          const feed =
            await parser.parseURL(
              source.url
            );

          const matches =
            feed.items.filter(item => {

              const title =
                (item.title || "")
                  .toLowerCase();

              const description =
                (item.contentSnippet || "")
                  .toLowerCase();

              const searchWord =
                keyword.toLowerCase();

              return (
                title.includes(searchWord) ||
                description.includes(searchWord)
              );
            });

          matches.forEach(item => {

            results.push({
              source: source.name,
              title: item.title,
              link: item.link
            });

          });

        } catch (sourceError) {

          console.log(
            `⚠️ Search failed for ${source.name}`
          );
        }
      }

      const uniqueResults =
        results.filter(
          (item, index, array) =>
            index ===
            array.findIndex(
              x => x.link === item.link
            )
        );

      if (
        uniqueResults.length === 0
      ) {

        await bot.sendMessage(
          chatId,
          `❌ No recent news found for *${keyword}*.`,
          {
            parse_mode: "Markdown"
          }
        );

        return;
      }

      const topResults =
        uniqueResults.slice(0, 5);

      let message =
        `🔎 *Search Results: ${keyword}*\n\n`;

      topResults.forEach(
        (item, index) => {

          message +=
            `${index + 1}. ${item.source}\n` +
            `📰 *${item.title}*\n` +
            `${item.link}\n\n`;
        }
      );

      await bot.sendMessage(
        chatId,
        message,
        {
          parse_mode: "Markdown",
          disable_web_page_preview: true
        }
      );

    } catch (error) {

      console.error(
        "❌ Search error:",
        error.message
      );

      await bot.sendMessage(
        chatId,
        "❌ Something went wrong while searching."
      );
    }
  }
);

// ==========================================
// BUTTONS
// ==========================================

bot.on("message", (msg) => {

  const chatId =
    msg.chat.id;

  const text =
    msg.text;

  if (
    !text ||
    text === "/start" ||
    text.startsWith("/")
  ) {
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

    case "🔎 Search News":

      bot.sendMessage(
        chatId,
        "🔎 *Search Daily Horizon News*\n\n" +
        "Type:\n" +
        "`/search Messi`\n" +
        "`/search Nigeria`\n" +
        "`/search Bitcoin`",
        {
          parse_mode: "Markdown"
        }
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

// ==========================================
// BOT STARTED
// ==========================================

console.log(
  "🚀 Daily Horizon Bot is running..."
);
