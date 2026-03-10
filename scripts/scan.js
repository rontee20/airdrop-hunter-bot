const https = require("https");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Helper to make https requests return a Promise
function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode >= 400) throw new Error(parsed.description || `Status ${res.statusCode}`);
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body.substring(0, 100)}`));
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function sendTelegram(text) {
  const data = JSON.stringify({ chat_id: CHAT_ID, text: text });
  const options = {
    hostname: "api.telegram.org",
    path: `/bot${BOT_TOKEN}/sendMessage`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
    },
  };
  return request(options, data);
}

async function fetchAirdrops() {
  console.log("Fetching trending coins...");
  const options = {
    hostname: "api.coingecko.com",
    path: "/api/v3/search/trending",
    method: "GET",
    headers: { "User-Agent": "airdrop-research-bot" }
  };

  try {
    const data = await request(options);
    const coins = data.coins ? data.coins.slice(0, 2) : [];

    if (coins.length === 0) {
      console.log("No coins found.");
      return;
    }

    for (const coin of coins) {
      const project = coin.item.name;
      const symbol = coin.item.symbol;
      const link = `https://www.coingecko.com/en/coins/${coin.item.id}`;

      const message = `📣 ${project} Potential Airdrop Research\n\n` +
        `⭐ Symbol : ${symbol}\n` +
        `⭐ Source : CoinGecko Trending\n\n` +
        `🖥 Project Overview\n` +
        `${project} is currently trending. High activity often precedes token incentives.\n\n` +
        `📊 Airdrop Confirmation : No\n` +
        `📊 Expected TGE : Unknown\n\n` +
        `🔗 Research Link\n${link}\n\n` +
        `⚠️ Always DYOR.`;

      await sendTelegram(message);
      console.log(`Sent: ${project}`);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

fetchAirdrops();
