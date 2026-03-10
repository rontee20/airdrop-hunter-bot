const https = require("https");
const cheerio = require("cheerio"); // New: Run 'npm install cheerio'
const buildPost = require("./research");

// 1. DefiLlama Scanner (No Token + High TVL)
async function getLlamaAlpha() {
  const data = await fetchRaw("https://api.llama.fi/protocols");
  return JSON.parse(data)
    .filter(p => p.airdrop === false && p.tvl > 5000000) // $5M+ TVL
    .slice(0, 2);
}

// 2. Airdrops.io Scraper (Latest Official Airdrops)
async function getAirdropsIoAlpha() {
  try {
    const html = await fetchRaw("https://airdrops.io/latest/");
    const $ = cheerio.load(html);
    const latest = [];
    
    $(".airdrop-item").each((i, el) => {
      if (i < 2) { // Just get the top 2
        latest.push({
          name: $(el).find(".title").text().trim(),
          link: $(el).find("a").attr("href")
        });
      }
    });
    return latest;
  } catch (e) { return []; }
}

// 3. News Scanner (Funding Rounds)
async function getNewsAlpha() {
  const rss = await fetchRaw("https://www.coindesk.com/arc/outboundfeeds/rss/");
  // Simple check for "Funding" or "Series" in the news titles
  if (rss.includes("Funding") || rss.includes("Series")) return ["New VC Funding Detected"];
  return [];
}

// --- MASTER SCANNER ---
async function startFullScan() {
  console.log("📡 SCANNING ALL PLATFORMS...");

  const [llama, manualAirdrops, news] = await Promise.all([
    getLlamaAlpha(),
    getAirdropsIoAlpha(),
    getNewsAlpha()
  ]);

  // Logic: Only post if we find something fresh
  if (llama.length > 0) {
    const p = llama[0];
    await sendTelegram(buildPost(p.name, p.url, "💎 HIGH TVL / NO TOKEN"));
  }

  if (manualAirdrops.length > 0) {
    const a = manualAirdrops[0];
    await sendTelegram(buildPost(a.name, a.link, "🔥 NEW LISTING (Airdrops.io)"));
  }
}

// Helper to fetch raw data/HTML
function fetchRaw(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      let body = "";
      res.on("data", (c) => body += c);
      res.on("end", () => resolve(body));
    }).on("error", reject);
  });
}
