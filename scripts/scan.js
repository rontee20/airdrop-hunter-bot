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
const postedFile   = "data/posted.json";
const scamLogFile  = "data/scam_log.json";

if (!fs.existsSync("data")) fs.mkdirSync("data");
if (!fs.existsSync(postedFile))  fs.writeFileSync(postedFile,  JSON.stringify([]));
if (!fs.existsSync(scamLogFile)) fs.writeFileSync(scamLogFile, JSON.stringify([]));

function getPosted() { return JSON.parse(fs.readFileSync(postedFile)); }
function savePosted(d) { fs.writeFileSync(postedFile, JSON.stringify(d, null, 2)); }

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

// ─── SCAM DETECTION ───────────────────────────────────────────────────────────
const SCAM_SIGNALS = [
  { pattern: /send\s+\d+.*get\s+\d+/i,                       weight: 100, reason: "Send X get X scam" },
  { pattern: /send\s+(eth|bnb|sol|usdt|btc)/i,               weight: 100, reason: "Send crypto scam" },
  { pattern: /double\s+your\s+(eth|bnb|sol|crypto|money)/i,  weight: 100, reason: "Doubling scam" },
  { pattern: /seed\s+phrase|private\s+key|recovery\s+phrase/i, weight: 100, reason: "Private key/seed phrase request" },
  { pattern: /approve\s+(transaction|contract)\s+to\s+claim/i, weight: 100, reason: "Approval drain scam" },
  { pattern: /pay\s+(fee|gas|tax)\s+to\s+(claim|receive|withdraw)/i, weight: 100, reason: "Fee to claim scam" },
  { pattern: /connect\s+wallet\s+to\s+claim/i,               weight: 90,  reason: "Fake wallet connect" },
  { pattern: /guaranteed\s+(profit|return|reward|income)/i,  weight: 90,  reason: "Guaranteed profit promise" },
  { pattern: /elon\s+(musk|tesla).*giveaway/i,               weight: 100, reason: "Fake Elon giveaway" },
  { pattern: /vitalik.*giveaway/i,                           weight: 100, reason: "Fake Vitalik giveaway" },
  { pattern: /official\s+giveaway.*send/i,                   weight: 90,  reason: "Fake official giveaway" },
  { pattern: /\b(etherum|ethreum|ethereun|etherium)\b/i,     weight: 80,  reason: "Ethereum typosquat" },
  { pattern: /\b(binnance|binanse|binanace)\b/i,             weight: 80,  reason: "Binance typosquat" },
  { pattern: /unclaimed\s+(tokens?|funds?|airdrop)/i,        weight: 65,  reason: "Fake unclaimed funds" },
  { pattern: /wallet\s+(eligible|qualified).*click/i,        weight: 65,  reason: "Wallet drain attempt" },
  { pattern: /dm\s+(me|us)\s+for\s+(details|info|more)/i,    weight: 60,  reason: "Suspicious DM request" },
  { pattern: /t\.me\/\+[a-zA-Z0-9]+/i,                       weight: 50,  reason: "Private group invite" },
];

const LEGIT_SIGNALS = [
  { pattern: /github\.com/i,                                   weight: 40 },
  { pattern: /testnet/i,                                       weight: 30 },
  { pattern: /\b(whitepaper|litepaper|docs\.)/i,               weight: 35 },
  { pattern: /\b(discord\.gg|twitter\.com|x\.com)\b/i,        weight: 20 },
  { pattern: /\b(task|quest|complete|follow|retweet)\b/i,      weight: 25 },
  { pattern: /\b(mainnet|devnet|layer\s*2|l2|rollup)\b/i,     weight: 30 },
  { pattern: /\b(retroactive|retroairdrop)\b/i,                weight: 35 },
  { pattern: /\b(galxe|zealy|layer3|guild\.xyz|crew3)\b/i,    weight: 40 },
  { pattern: /\b(protocol|defi|bridge|staking|liquidity)\b/i, weight: 20 },
  { pattern: /\b(audit|audited|certik|chainalysis)\b/i,       weight: 35 },
  { pattern: /\b(backed by|funded|investors?|vc|sequoia|paradigm|a16z)\b/i, weight: 30 },
  { pattern: /\$[0-9]+[MBK]\b/i,                              weight: 25 }, // funding amount
  { pattern: /\bTGE\b/i,                                       weight: 20 },
  { pattern: /\b(stripe|coinbase|binance labs|polychain)\b/i, weight: 35 },
];

function analyzePost(text) {
  let scamScore = 0, legitScore = 0, scamReasons = [], legitReasons = [];

  for (const s of SCAM_SIGNALS) {
    if (s.pattern.test(text)) { scamScore += s.weight; scamReasons.push(s.reason); }
  }
  for (const s of LEGIT_SIGNALS) {
    if (s.pattern.test(text)) { legitScore += s.weight; legitReasons.push(s.reason); }
  }

  if (text.length < 80) scamScore += 30;
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.5) scamScore += 25;

  const isScam   = (scamScore - legitScore) > 50 || scamScore >= 100;
  const confidence = Math.min(100, Math.max(0, Math.round(legitScore / (legitScore + scamScore + 1) * 100)));
  const riskLevel  = scamScore >= 100 ? "HIGH" : scamScore >= 50 ? "MEDIUM" : "LOW";

  return { verdict: isScam ? "SCAM" : "LEGITIMATE", confidence, scamScore, legitScore, scamReasons, legitReasons, riskLevel };
}

// ─── POST TYPE DETECTOR ───────────────────────────────────────────────────────
function detectPostType(text) {
  const t = text.toLowerCase();

  // Full guide post — has funding, team info, step links, rating
  const hasGuideSignals =
    (t.includes("funding") || t.includes("backed by") || t.includes("incubated")) &&
    (t.includes("team") || t.includes("co-founder") || t.includes("ceo")) &&
    (t.includes("rating") || t.includes("tge") || t.includes("guide"));

  // Quick update — short, has live/claim/link
  const hasUpdateSignals =
    text.length < 600 &&
    (t.includes("live") || t.includes("claim") || t.includes("link :") || t.includes("mint"));

  if (hasGuideSignals) return "GUIDE";
  if (hasUpdateSignals) return "UPDATE";
  return "STANDARD";
}

// ─── EXTRACTORS ───────────────────────────────────────────────────────────────
function extractLinks(text) {
  const urlRegex = /https?:\/\/[^\s\)\],]+/g;
  return [...new Set(text.match(urlRegex) || [])];
}

function extractProjectName(text) {
  // Try "ProjectName Airdrop" or "ProjectName :" pattern
  const m =
    text.match(/^[\s\S]*?([A-Z][a-zA-Z0-9]+(?:\s[A-Z][a-zA-Z0-9]+)?)\s+(?:Airdrop|Testnet|Guide|Update|x\s)/m) ||
    text.match(/\$([A-Z]{2,8})\b/) ||
    text.match(/([A-Z][a-zA-Z0-9]{2,})\s*:/);
  return m ? m[1].trim() : "Crypto Project";
}

function extractCategory(text) {
  const t = text.toLowerCase();
  if (t.includes("testnet"))  return { name: "Testnet Guide",  emoji: "🧪" };
  if (t.includes("nft") || t.includes("mint") || t.includes("sbt")) return { name: "NFT / SBT", emoji: "🖼" };
  if (t.includes("claim") && t.includes("live")) return { name: "Claim Live", emoji: "⚡" };
  if (t.includes("defi") || t.includes("swap")) return { name: "DeFi",  emoji: "💰" };
  if (t.includes("campaign") || t.includes("quest")) return { name: "Campaign", emoji: "📣" };
  if (t.includes("whitelist") || t.includes("allowlist")) return { name: "Whitelist", emoji: "📋" };
  return { name: "Airdrop", emoji: "🪂" };
}

function extractFunding(text) {
  const m = text.match(/\$[\d,.]+[MBK](?:\s+(?:at|@)\s+\$[\d,.]+[MBK](?:\s+FDV)?)?/i);
  return m ? m[0] : null;
}

function extractTGE(text) {
  const m = text.match(/(?:TGE|tge)[^\n]*?(Q[1-4][\s\-–]*(?:20)?\d{2,4}|[A-Z][a-z]+\s+20\d{2}|\d{4})/i);
  return m ? m[1].trim() : null;
}

function extractRating(text) {
  const m = text.match(/[Rr]ating[\s:–-]*([0-9.]+\s*\/\s*10)/);
  return m ? m[1].trim() : null;
}

function extractBackers(text) {
  const m = text.match(/[Bb]acked\s+by\s*:?\s*([^\n]+)/);
  return m ? m[1].trim() : null;
}

function extractTeam(text) {
  const lines = text.split("\n");
  const teamStart = lines.findIndex(l => /team\s*:/i.test(l));
  if (teamStart === -1) return [];
  return lines
    .slice(teamStart + 1, teamStart + 6)
    .map(l => l.trim())
    .filter(l => l.length > 3 && !l.match(/^https?:/));
}

function extractSteps(text) {
  const links = extractLinks(text);
  // numbered steps
  const numbered = [...text.matchAll(/\d+\.\s+(https?:\/\/[^\s]+)/g)].map(m => m[1]);
  return numbered.length ? numbered : links;
}

// ─── FORMATTERS ───────────────────────────────────────────────────────────────

function formatGuidePost(rawText, source) {
  const projectName = extractProjectName(rawText);
  const category    = extractCategory(rawText);
  const funding     = extractFunding(rawText);
  const tge         = extractTGE(rawText);
  const rating      = extractRating(rawText);
  const backers     = extractBackers(rawText);
  const team        = extractTeam(rawText);
  const steps       = extractSteps(rawText);

  // Pull description — find sentence with "is a" or "designed for"
  const descMatch = rawText.match(/[A-Z][^.!?]*(?:is a|designed for|built for|next-gen|Layer)[^.!?]{10,}[.!?]/i);
  const description = descMatch ? descMatch[0].trim() : "";

  // Pull incubated/partnerships lines
  const incubated = rawText.match(/[Ii]ncubated\s+by\s+([^\n]+)/)?.[1]?.trim();
  const partnerships = rawText.match(/[Pp]artnership[s]?\s*:\s*([^\n]+)/)?.[1]?.trim();

  let lines = [];

  lines.push(`${category.emoji} <b>${projectName} : ${category.name}</b>`);
  lines.push(`<i>New users can also join ——</i>\n`);

  if (funding)      lines.push(`💰 <b>Funding :</b> ${funding}`);
  if (incubated)    lines.push(`🏗 <b>Incubated by</b> ${incubated}`);
  if (backers)      lines.push(`🤝 <b>Backed by :</b> ${backers}`);
  if (partnerships) lines.push(`🔗 <b>Partnerships:</b> ${partnerships}\n`);

  if (description)  lines.push(`📌 <b>Project</b> - ${description}\n`);

  lines.push(`👤 <b>Users</b> - No Info`);
  lines.push(`✅ <b>Airdrop Confirmation</b> - ${rawText.toLowerCase().includes("confirmed") ? "Yes" : "No"}`);
  lines.push(`👥 <b>Referral System</b> - ${rawText.toLowerCase().includes("referral") ? "Yes" : "No"}`);
  if (tge)    lines.push(`📅 <b>Expected TGE</b> - ${tge}`);
  if (rating) lines.push(`⭐ <b>Airdrop Rating</b> - ${rating}\n`);

  if (team.length) {
    lines.push(`👨‍💻 <b>Team :</b>`);
    team.forEach(t => lines.push(`  • ${t}`));
    lines.push("");
  }

  if (steps.length) {
    lines.push(`📋 <b>All the Links</b>`);
    steps.forEach((link, i) => lines.push(`${i + 1}. ${link}`));
  }

  lines.push(`\n━━━━━━━━━━━━━━━`);
  lines.push(`🤖 <i>AirdropHunter Bot</i>`);

  return lines.join("\n");
}

function formatUpdatePost(rawText, source) {
  const projectName = extractProjectName(rawText);
  const category    = extractCategory(rawText);
  const links       = extractLinks(rawText);

  // Try to find a clean link label
  const linkLine = rawText.match(/[Ll]ink\s*:\s*(https?:\/\/\S+)/);
  const mainLink = linkLine ? linkLine[1] : links[0] || "";

  // Pull all non-link, non-empty lines as body
  const bodyLines = rawText
    .split("\n")
    .map(l => l.trim())
    .filter(l => l && !l.match(/^https?:\/\//) && !l.match(/^[Ll]ink\s*:/));

  // Remove the first line (usually the title we extracted)
  const title = bodyLines[0] || `${projectName} Update`;
  const body  = bodyLines.slice(1).join("\n").trim();

  let lines = [];

  lines.push(`${category.emoji} <b>${title}</b>\n`);

  if (mainLink) lines.push(`🔗 <b>Link :</b> ${mainLink}\n`);

  if (body) lines.push(body);

  if (links.length > 1) {
    lines.push("\n<b>More Links:</b>");
    links.slice(1).forEach(l => lines.push(`• ${l}`));
  }

  lines.push(`\n━━━━━━━━━━━━━━━`);
  lines.push(`🤖 <i>AirdropHunter Bot</i>`);

  return lines.join("\n");
}

function formatStandardPost(rawText, source) {
  const projectName = extractProjectName(rawText);
  const category    = extractCategory(rawText);
  const links       = extractLinks(rawText);
  const tge         = extractTGE(rawText);
  const funding     = extractFunding(rawText);

  let lines = [];

  lines.push(`${category.emoji} <b>${projectName}</b> — ${category.name}\n`);
  lines.push(rawText.slice(0, 280));

  if (funding)    lines.push(`\n💰 <b>Funding:</b> ${funding}`);
  if (tge)        lines.push(`📅 <b>Expected TGE:</b> ${tge}`);

  if (links.length) {
    lines.push("\n🔗 <b>Links:</b>");
    links.slice(0, 5).forEach((l, i) => lines.push(`${i + 1}. ${l}`));
  }

  lines.push(`\n━━━━━━━━━━━━━━━`);
  lines.push(`🤖 <i>AirdropHunter Bot</i>`);

  return lines.join("\n");
}

function formatPost(post) {
  const type = detectPostType(post.title);
  console.log(`   📄 Post type detected: ${type}`);
  if (type === "GUIDE")  return formatGuidePost(post.title, post.source);
  if (type === "UPDATE") return formatUpdatePost(post.title, post.source);
  return formatStandardPost(post.title, post.source);
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

// ─── SCRAPER ──────────────────────────────────────────────────────────────────
async function scanTelegramChannels() {
  let results = [];
  for (const url of telegramChannels) {
    const webUrl = url.includes("/s/") ? url : url.replace("t.me/", "t.me/s/");
    try {
      console.log("🔍 Scanning:", webUrl);
      const res = await axios.get(webUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36" },
        timeout: 10000,
      });
      const $ = cheerio.load(res.data);
      $(".tgme_widget_message_text").each((i, el) => {
        const text = $(el).text().trim();
        if (!text || text.length < 30) return;
        const lower = text.toLowerCase();
        if (
          lower.includes("airdrop") || lower.includes("testnet")  ||
          lower.includes("campaign") || lower.includes("whitelist") ||
          lower.includes("free mint") || lower.includes("early access") ||
          lower.includes("retroactive") || lower.includes("claim") ||
          lower.includes("tge")
        ) {
          results.push({ title: text.slice(0, 1500), source: webUrl });
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
  console.log("🚀 AirdropHunter Bot starting...\n");

  const posts = await scanTelegramChannels();
  if (posts.length === 0) { console.log("😴 No posts found."); return; }

  let sent = 0, skipped = 0;

  for (const post of posts) {
    if (isDuplicate(post.title)) { console.log("⏭  Duplicate, skipping."); continue; }

    const analysis = analyzePost(post.title);
    console.log(`🧠 "${post.title.slice(0, 60)}..."`);
    console.log(`   → ${analysis.verdict} | Risk: ${analysis.riskLevel} | Trust: ${analysis.confidence}/100`);

    if (analysis.verdict === "SCAM" || analysis.riskLevel === "HIGH") {
      logScam(post, analysis.scamReasons.join(", "));
      console.log(`   🚫 Blocked: ${analysis.scamReasons[0]}`);
      skipped++; continue;
    }
    if (analysis.riskLevel === "MEDIUM" && analysis.legitScore < 20) {
      logScam(post, "Medium risk, no legit signals");
      console.log(`   ⚠️  Skipped: Medium risk, no legit signals`);
      skipped++; continue;
    }

    const message = formatPost(post);
    await sendTelegram(message);
    sent++;
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n✅ Done — Sent: ${sent} | Blocked: ${skipped}`);
}

main();
