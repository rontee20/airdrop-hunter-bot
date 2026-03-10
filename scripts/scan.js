const https = require("https");
const buildPost = require("./research"); // This connects to your research.js

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Helper function to handle API requests
function fetchJSON(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const data = JSON.parse(body);
          if (res.statusCode >= 400) return reject(new Error(`API Error ${res.statusCode}`));
          resolve(data);
        } catch (e) { reject(new Error("JSON Parse Error")); }
      });
    });
    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// Telegram sender with safety checks
async function sendTelegram(text) {
  const data = JSON.stringify({
    chat_id: CHAT_ID,
    text: text,
    parse_mode: "HTML",
    disable_web_page_preview: false
  });

  const options = {
    hostname: "api.telegram.org",
    path: `/bot${BOT_TOKEN}/sendMessage`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data) // Vital for emojis/notifications
    }
  };

  try {
    await fetchJSON(options, data);
    console.log("✅ Message sent to Telegram!");
  } catch (err) {
    console.error("❌ Telegram failed. Check Token/ChatID.");
  }
}

async function startScan() {
  console.log("🔍 Scanning for Alpha...");
  
  try {
    // Tool 1: CoinGecko (Hype)
    const geckoData = await fetchJSON({
      hostname: "api.coingecko.com",
      path: "/api/v3/search/trending",
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    // Tool 2: DefiLlama (Real TVL Alpha)
    const llamaData = await fetchJSON({
      hostname: "api.llama.fi",
      path: "/protocols",
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    // Send Trending Coin
    const coin = geckoData.coins[0].item;
    const post1 = buildPost(coin.name, `https://www.coingecko.com/en/coins/${coin.id}`, "Trending Hype");
    await sendTelegram(post1);

    // Send TVL Gainer (No Token)
    const protocol = llamaData.find(p => p.airdrop === false && p.tvl > 1000000);
    if (protocol) {
      const post2 = buildPost(protocol.name, protocol.url, "High TVL / No Token 💎");
      await sendTelegram(post2);
    }

  } catch (err) {
    console.error("Scan Error:", err.message);
  }
}

startScan();
