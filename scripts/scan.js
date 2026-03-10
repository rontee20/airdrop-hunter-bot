const https = require("https");
const buildPost = require("./research");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

function sendTelegram(text) {
  const data = JSON.stringify({
    chat_id: CHAT_ID,
    text: text,
    parse_mode: "HTML" // Using HTML is often easier than escaping MarkdownV2
  });

  const options = {
    hostname: "api.telegram.org",
    path: `/bot${BOT_TOKEN}/sendMessage`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data) // Fix: Measure bytes, not characters
    }
  };

  const req = https.request(options, res => {
    res.on("data", d => process.stdout.write(d));
  });

  req.on("error", e => console.error("Telegram Error:", e));
  req.write(data);
  req.end();
}

// Search trending coins
https.get(
  "https://api.coingecko.com/api/v3/search/trending",
  { headers: { "User-Agent": "airdrop-bot" } },
  res => {
    let body = "";
    res.on("data", chunk => body += chunk);
    res.on("end", () => {
      try {
        const data = JSON.parse(body);
        const coins = data.coins ? data.coins.slice(0, 2) : [];

        coins.forEach(coin => {
          const projectName = coin.item.name;
          const projectLink = `https://www.coingecko.com/en/coins/${coin.item.id}`;

          // Generate the attractive post from your module
          const post = buildPost(projectName, projectLink);
          sendTelegram(post);
        });
      } catch (e) {
        console.error("Failed to parse CoinGecko response:", e.message);
      }
    });
  }
).on("error", e => console.error("CoinGecko Error:", e));
