import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import { telegramChannels } from "../config/sources.js";

// ─── ENV VALIDATION ───────────────────────────────────────────────────────────
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!BOT_TOKEN || !CHAT_ID || !ANTHROPIC_KEY) {
  console.error("❌ Missing env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, ANTHROPIC_API_KEY");
  process.exit(1);
}

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const postedFile = "data/posted.json";
const scamLogFile = "data/scam_log.json";

if (!fs.existsSync("data")) fs.mkdirSync("data");
if (!fs.existsSync(postedFile)) fs.writeFileSync(postedFile, JSON.stringify([]));
if (!fs.existsSync(scamLogFile)) fs.writeFileSync(scamLogFile, JSON.stringify([]));

function getPosted() {
  return JSON.parse(fs.readFileSync(postedFile));
}
function savePosted(data) {
  fs.writeFileSync(postedFile, JSON.stringify(data, null, 2));
}
function isDuplicate(title) {
  const posted = getPosted();
  if (posted.includes(title)) return true;
  posted.push(title);
  savePosted(posted);
  return false;
}
function logScam(post, reason) {
  const log = JSON.parse(fs.readFileSync(scamLogFile));
  log.push({ title: post.title, source: post.source, reason, time: new Date().toISOString() });
  fs.writeFileSync(scamLogFile, JSON.stringify(log, null, 2));
}

// ─── AI VERIFICATION ──────────────────────────────────────────────────────────
async function verifyWithAI(postText, source) {
  const prompt = `You are a professional crypto analyst and scam detector with years of experience.

Analyze this airdrop/crypto post and decide if it is LEGITIMATE or a SCAM/LOW-QUALITY post.

POST TEXT:
"${postText}"

SOURCE: ${source}

SCAM SIGNALS to watch for:
- Promises of guaranteed profits or unrealistic rewards ("1000x", "guaranteed money")
- Urgent pressure tactics ("only 100 spots left", "ends in 1 hour")
- Asks for private keys, seed phrases, or upfront payment
- Vague project with no real details
- Excessive emojis and hype with no substance
- No mention of a real team, GitHub, whitepaper, or official links
- Known scam patterns: "send X get 2X", "connect wallet to claim"
- Misspellings of known projects (e.g., "Etherum", "Binnance")
- Too good to be true reward amounts

LEGITIMATE SIGNALS:
- Real project name with verifiable online presence
- Testnet or mainnet participation (not just "click link")
- Task-based airdrops (follow, retweet, use protocol)
- Mentions of GitHub, docs, or official website
- Realistic reward structure
- Clear instructions without asking for funds or keys

Respond ONLY in this exact JSON format (no extra text):
{
  "verdict": "LEGITIMATE" or "SCAM",
  "confidence": 0-100,
  "reason": "one sentence explanation",
  "project_name": "extracted project name or Unknown",
  "category": "Airdrop" or "Testnet" or "Campaign" or "NFT" or "DeFi" or "Other",
  "reward_info": "brief reward details or Not specified",
  "risk_level": "LOW" or "MEDIUM" or "HIGH"
}`;

  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      }
    );

    const raw = response.data.content[0].text.trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.log("⚠️  AI verification failed:", err.message);
    return null;
  }
}

// ─── TELEGRAM SENDER ──────────────────────────────────────────────────────────
async function sendTelegram(text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    });
    console.log("✅ Sent to Telegram");
  } catch (err) {
    console.log("❌ Telegram error:", err.response?.data || err.message);
  }
}

// ─── POST FORMATTER ───────────────────────────────────────────────────────────
function formatPost(post, analysis) {
  const riskEmoji = { LOW: "🟢", MEDIUM: "🟡", HIGH: "🔴" };
  const categoryEmoji = {
    Airdrop: "🪂",
    Testnet: "🧪",
    Campaign: "📣",
    NFT: "🖼",
    DeFi: "💰",
    Other: "🔷",
  };

  return `${categoryEmoji[analysis.category] || "🔷"} <b>${analysis.project_name}</b> — ${analysis.category}

📋 <b>Summary</b>
${post.title}

💎 <b>Reward</b>
${analysis.reward_info}

🧠 <b>AI Analysis</b>
${analysis.reason}

${riskEmoji[analysis.risk_level]} <b>Risk Level:</b> ${analysis.risk_level}
✅ <b>Confidence:</b> ${analysis.confidence}% Legitimate

🔗 <b>Source:</b> <a href="${post.source}">${post.source}</a>

━━━━━━━━━━━━━━━━━━━━
🤖 <i>Verified by AirdropHunter AI</i>`;
}

// ─── SCRAPER ──────────────────────────────────────────────────────────────────
async function scanTelegramChannels() {
  let results = [];
  for (const url of telegramChannels) {
    // Ensure /s/ path for public web preview
    const webUrl = url.includes("/s/") ? url : url.replace("t.me/", "t.me/s/");
    try {
      console.log("🔍 Scanning:", webUrl);
      const res = await axios.get(webUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        },
        timeout: 10000,
      });
      const $ = cheerio.load(res.data);
      $(".tgme_widget_message_text").each((i, el) => {
        const text = $(el).text().trim();
        if (!text || text.length < 30) return;
        const lower = text.toLowerCase();
        if (
          lower.includes("airdrop") ||
          lower.includes("testnet") ||
          lower.includes("campaign") ||
          lower.includes("whitelist") ||
          lower.includes("free mint") ||
          lower.includes("early access")
        ) {
          results.push({
            title: text.slice(0, 300),
            source: webUrl,
          });
        }
      });
    } catch (err) {
      console.log("⚠️  Scan error:", webUrl, "-", err.message);
    }
  }
  console.log(`📦 Raw posts found: ${results.length}`);
  return results;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 AirdropHunter AI starting scan...\n");

  const posts = await scanTelegramChannels();

  if (posts.length === 0) {
    console.log("😴 No posts found this scan.");
    return;
  }

  let sent = 0;
  let skipped = 0;

  for (const post of posts) {
    if (isDuplicate(post.title)) {
      console.log("⏭  Duplicate, skipping.");
      continue;
    }

    console.log(`\n🧠 Analyzing: "${post.title.slice(0, 60)}..."`);
    const analysis = await verifyWithAI(post.title, post.source);

    if (!analysis) {
      console.log("⚠️  AI returned no result, skipping.");
      skipped++;
      continue;
    }

    console.log(`   → ${analysis.verdict} (${analysis.confidence}%) — ${analysis.reason}`);

    if (analysis.verdict === "SCAM" || analysis.confidence < 65) {
      logScam(post, analysis.reason);
      console.log(`   🚫 Blocked as scam/low-quality.`);
      skipped++;
      continue;
    }

    const message = formatPost(post, analysis);
    await sendTelegram(message);
    sent++;

    // Rate limit: avoid Telegram flood
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\n✅ Done. Sent: ${sent} | Skipped/Blocked: ${skipped}`);
}

main();
