import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import { telegramChannels } from "../config/sources.js";

// ─── ENV VALIDATION ───────────────────────────────────────────────────────────
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error("❌ Missing env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID");
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

// ─── SCAM DETECTION ENGINE ────────────────────────────────────────────────────

const SCAM_SIGNALS = [
  // Hard scams (instant block)
  { pattern: /send\s+\d+.*get\s+\d+/i, weight: 100, reason: "Send X get X scam" },
  { pattern: /send\s+(eth|bnb|sol|usdt|btc)/i, weight: 100, reason: "Send crypto scam" },
  { pattern: /double\s+your\s+(eth|bnb|sol|crypto|money)/i, weight: 100, reason: "Doubling scam" },
  { pattern: /seed\s+phrase|private\s+key|recovery\s+phrase/i, weight: 100, reason: "Asking for private key/seed phrase" },
  { pattern: /approve\s+(transaction|contract)\s+to\s+claim/i, weight: 100, reason: "Approval drain scam" },
  { pattern: /pay\s+(fee|gas|tax)\s+to\s+(claim|receive|withdraw)/i, weight: 100, reason: "Fee to claim scam" },
  { pattern: /connect\s+wallet\s+to\s+claim/i, weight: 90, reason: "Fake wallet connect claim" },
  { pattern: /guaranteed\s+(profit|return|reward|income)/i, weight: 90, reason: "Guaranteed profit promise" },
  { pattern: /risk[\s-]free\s+(profit|money|income)/i, weight: 90, reason: "Risk-free money claim" },
  // Fake celebrity giveaways
  { pattern: /elon\s+(musk|tesla).*giveaway/i, weight: 100, reason: "Fake Elon giveaway" },
  { pattern: /vitalik.*giveaway/i, weight: 100, reason: "Fake Vitalik giveaway" },
  { pattern: /official\s+giveaway.*send/i, weight: 90, reason: "Fake official giveaway" },
  // Typosquatting known projects
  { pattern: /\b(etherum|ethreum|ethereun|etherium)\b/i, weight: 80, reason: "Ethereum typosquat" },
  { pattern: /\b(binnance|binanse|binanace)\b/i, weight: 80, reason: "Binance typosquat" },
  { pattern: /\b(solona|solanna|solanaa)\b/i, weight: 80, reason: "Solana typosquat" },
  // Wallet drainers
  { pattern: /unclaimed\s+(tokens?|funds?|airdrop)/i, weight: 65, reason: "Fake unclaimed funds" },
  { pattern: /wallet\s+(eligible|qualified).*click/i, weight: 65, reason: "Wallet drain attempt" },
  { pattern: /claim\s+your\s+\$\d+/i, weight: 70, reason: "Fake token claim" },
  // Pressure tactics
  { pattern: /only\s+\d+\s+spots?\s+(left|remaining)/i, weight: 70, reason: "Fake scarcity tactic" },
  { pattern: /dm\s+(me|us)\s+for\s+(details|info|more)/i, weight: 60, reason: "Suspicious DM request" },
  { pattern: /t\.me\/\+[a-zA-Z0-9]+/i, weight: 50, reason: "Private group invite link" },
  { pattern: /act\s+now|last\s+chance|don'?t\s+miss/i, weight: 50, reason: "Pressure tactic" },
];

const LEGIT_SIGNALS = [
  { pattern: /github\.com/i, weight: 40, reason: "Has GitHub link" },
  { pattern: /testnet/i, weight: 30, reason: "Testnet participation" },
  { pattern: /\b(whitepaper|litepaper|docs\.)/i, weight: 35, reason: "Has documentation" },
  { pattern: /\b(discord\.gg|twitter\.com|x\.com)\b/i, weight: 20, reason: "Has social links" },
  { pattern: /\b(task|quest|complete|follow|retweet)\b/i, weight: 25, reason: "Task-based airdrop" },
  { pattern: /\b(mainnet|devnet|layer\s*2|l2|rollup)\b/i, weight: 30, reason: "Real network mention" },
  { pattern: /\b(retroactive|retroairdrop)\b/i, weight: 35, reason: "Retroactive airdrop" },
  { pattern: /\b(galxe|zealy|layer3|guild\.xyz|crew3)\b/i, weight: 40, reason: "Legit airdrop platform" },
  { pattern: /\b(protocol|defi|bridge|staking|liquidity)\b/i, weight: 20, reason: "Real DeFi mention" },
  { pattern: /\b(audit|audited|certik|chainalysis|immunefi)\b/i, weight: 35, reason: "Security audit mentioned" },
  { pattern: /\b(backed by|funded by|investors?|vc)\b/i, weight: 25, reason: "Funding/VC mention" },
];

function detectCategory(text) {
  const t = text.toLowerCase();
  if (t.includes("testnet")) return { name: "Testnet", emoji: "🧪" };
  if (t.includes("nft") || t.includes("mint")) return { name: "NFT", emoji: "🖼" };
  if (t.includes("defi") || t.includes("dex") || t.includes("swap")) return { name: "DeFi", emoji: "💰" };
  if (t.includes("campaign") || t.includes("quest") || t.includes("galxe")) return { name: "Campaign", emoji: "📣" };
  if (t.includes("whitelist") || t.includes("allowlist")) return { name: "Whitelist", emoji: "📋" };
  if (t.includes("airdrop")) return { name: "Airdrop", emoji: "🪂" };
  return { name: "Crypto Alpha", emoji: "🔷" };
}

function extractProjectName(text) {
  const patterns = [
    /\$([A-Z]{2,8})\b/,
    /\b([A-Z][a-zA-Z0-9]{2,}(?:\s+[A-Z][a-zA-Z0-9]+)?)\s+(airdrop|testnet|protocol|finance|network|chain)/i,
    /\b(airdrop|testnet)\s+(?:by|from|of)\s+([A-Z][a-zA-Z0-9]+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return (m[1] || m[2]).trim();
  }
  return "Crypto Project";
}

function extractReward(text) {
  const patterns = [
    /\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?/,
    /[\d,]+\s*(tokens?|coins?|points?|XP|USDT|ETH|BNB)/i,
    /up\s+to\s+[\d,]+/i,
    /worth\s+\$[\d,]+/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0];
  }
  return "Not specified";
}

function analyzePost(text) {
  let scamScore = 0;
  let legitScore = 0;
  let scamReasons = [];
  let legitReasons = [];

  for (const signal of SCAM_SIGNALS) {
    if (signal.pattern.test(text)) {
      scamScore += signal.weight;
      scamReasons.push(signal.reason);
    }
  }
  for (const signal of LEGIT_SIGNALS) {
    if (signal.pattern.test(text)) {
      legitScore += signal.weight;
      legitReasons.push(signal.reason);
    }
  }

  // Penalize very short posts
  if (text.length < 80) scamScore += 30;

  // Penalize heavy ALL CAPS
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.5) scamScore += 25;

  const netScore = scamScore - legitScore;
  const isScam = netScore > 50 || scamScore >= 100;
  const confidence = Math.min(100, Math.max(0,
    Math.round((legitScore / (legitScore + scamScore + 1)) * 100)
  ));
  const riskLevel = scamScore >= 100 ? "HIGH" : scamScore >= 50 ? "MEDIUM" : "LOW";

  return {
    verdict: isScam ? "SCAM" : "LEGITIMATE",
    confidence,
    scamScore,
    legitScore,
    scamReasons,
    legitReasons,
    riskLevel,
    category: detectCategory(text),
    projectName: extractProjectName(text),
    reward: extractReward(text),
  };
}

// ─── TELEGRAM SENDER ──────────────────────────────────────────────────────────
async function sendTelegram(text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    });
    console.log("   ✅ Sent to Telegram");
  } catch (err) {
    console.log("   ❌ Telegram error:", err.response?.data || err.message);
  }
}

// ─── POST FORMATTER ───────────────────────────────────────────────────────────
function formatPost(post, analysis) {
  const riskEmoji = { LOW: "🟢", MEDIUM: "🟡", HIGH: "🔴" };
  const legitInfo = analysis.legitReasons.length
    ? analysis.legitReasons.slice(0, 3).join(" • ")
    : "Community-verified source";

  return `${analysis.category.emoji} <b>${analysis.projectName}</b> — ${analysis.category.name}

📋 <b>Details</b>
${post.title.slice(0, 250)}

💎 <b>Reward</b>
${analysis.reward}

🔎 <b>Why it's verified</b>
${legitInfo}

${riskEmoji[analysis.riskLevel]} <b>Risk:</b> ${analysis.riskLevel} | ✅ <b>Trust Score:</b> ${analysis.confidence}/100

🔗 <b>Source:</b> <a href="${post.source}">${post.source}</a>

━━━━━━━━━━━━━━━━━━━━
🤖 <i>Verified by AirdropHunter Bot</i>`;
}

// ─── SCRAPER ──────────────────────────────────────────────────────────────────
async function scanTelegramChannels() {
  let results = [];
  for (const url of telegramChannels) {
    const webUrl = url.includes("/s/") ? url : url.replace("t.me/", "t.me/s/");
    try {
      console.log("🔍 Scanning:", webUrl);
      const res = await axios.get(webUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
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
          lower.includes("early access") ||
          lower.includes("retroactive")
        ) {
          results.push({ title: text.slice(0, 300), source: webUrl });
        }
      });
    } catch (err) {
      console.log("⚠️  Scan error:", webUrl, "-", err.message);
    }
  }
  console.log(`\n📦 Raw posts found: ${results.length}\n`);
  return results;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 AirdropHunter Bot starting scan...\n");

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

    const analysis = analyzePost(post.title);
    console.log(`🧠 "${post.title.slice(0, 60)}..."`);
    console.log(`   → ${analysis.verdict} | Risk: ${analysis.riskLevel} | Trust: ${analysis.confidence}/100`);

    if (analysis.verdict === "SCAM" || analysis.riskLevel === "HIGH") {
      logScam(post, analysis.scamReasons.join(", "));
      console.log(`   🚫 Blocked: ${analysis.scamReasons[0]}`);
      skipped++;
      continue;
    }

    if (analysis.riskLevel === "MEDIUM" && analysis.legitScore < 20) {
      logScam(post, "Medium risk with no legit signals");
      console.log(`   ⚠️  Skipped: Medium risk, no legit signals`);
      skipped++;
      continue;
    }

    const message = formatPost(post, analysis);
    await sendTelegram(message);
    sent++;

    // Avoid Telegram flood limit
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\n✅ Done — Sent: ${sent} | Blocked: ${skipped}`);
}

main();
