const RSSParser = require("rss-parser");
const axios = require("axios");
const buildPost = require("./research");
const sendTelegram = require("./telegram");

const parser = new RSSParser();

/** * 1️⃣ NEWS & FUNDING (CoinDesk, The Block)
 * Scans for keywords like "Funding", "Raised", "Seed", "Series"
 */
async function scanNews() {
  const feeds = [
    "https://www.coindesk.com/arc/outboundfeeds/rss/",
    "https://cointelegraph.com/rss"
  ];
  
  for (const url of feeds) {
    const feed = await parser.parseURL(url);
    const fundingNews = feed.items.filter(item => 
      /funding|raised|seed|series|million|invested/i.test(item.title)
    );
    
    // Process the first 2 fresh funding news
    fundingNews.slice(0, 2).forEach(item => {
      sendTelegram(buildPost(item.title, item.link, "💰 Funding Announcement"));
    });
  }
}

/** * 2️⃣ WEB3 QUESTS (Galxe GraphQL)
 * Galxe uses GraphQL to fetch the newest campaigns.
 */
async function scanGalxe() {
  const graphqlQuery = {
    query: `
      query {
        space(alias: "bnbchain") { 
          campaigns(input: { first: 2, listType: Newest }) {
            list { id name }
          }
        }
      }
    `
  };

  try {
    const res = await axios.post("https://graphigo.prd.galaxy.eco/query", graphqlQuery);
    const campaigns = res.data.data.space.campaigns.list;
    campaigns.forEach(c => {
      sendTelegram(buildPost(c.name, `https://app.galxe.com/quest/${c.id}`, "🎮 New Galxe Quest"));
    });
  } catch (e) { console.error("Galxe Scan Failed"); }
}

/** * 3️⃣ AIRDROP AGGREGATORS (Simple Monitor)
 * For Airdrops.io or CryptoRank, since they lack public APIs, 
 * RSS or basic scraping (as shown in the previous step) is best.
 */
async function scanAggregators() {
    // Logic for scraping Airdrops.io /latest using Cheerio 
    // as discussed in the previous response.
}

/** * 🚀 MASTER EXECUTION
 */
async function runAllPlatforms() {
  console.log("🛰 GLOBAL SCAN STARTED...");
  await Promise.all([
    scanNews(),
    scanGalxe(),
    // Add your CoinGecko/Llama scans here too
  ]);
  console.log("🏁 GLOBAL SCAN FINISHED.");
}

runAllPlatforms();
