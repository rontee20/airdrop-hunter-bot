import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import { telegramChannels } from "../config/sources.js";

// ─── ENV VALIDATION ───────────────────────────────────────────────────────────
const BOT_TOKEN   = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID     = process.env.TELEGRAM_CHAT_ID;
const OPENAI_KEY  = process.env.OPENAI_API_KEY;
const SERP_KEY    = process.env.SERPAPI_KEY; // optional but recommended

if (!BOT_TOKEN || !CHAT_ID || !OPENAI_KEY) {
  console.error("❌ Missing env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, OPENAI_API_KEY");
  process.exit(1);
}

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const postedFile  = "data/posted.json";
const scamLogFile = "data/scam_log.json";
const cacheFile   = "data/research_cache.json";

if (!fs.existsSync("data")) fs.mkdirSync("data");
if (!fs.existsSync(postedFile))  fs.writeFileSync(postedFile,  JSON.stringify([]));
if (!fs.existsSync(scamLogFile)) fs.writeFileSync(scamLogFile, JSON.stringify([]));
if (!fs.existsSync(cacheFile))   fs.writeFileSync(cacheFile,   JSON.stringify({}));

function getPosted() { return JSON.parse(fs.readFileSync(postedFile)); }
function savePosted(d) { fs.writeFileSync(postedFile, JSON.stringify(d, null, 2)); }
function getCache()  { return JSON.parse(fs.readFileSync(cacheFile)); }
function setCache(key, val) {
  const c = getCache(); c[key] = val;
  fs.writeFileSync(cacheFile, JSON.stringify(c, null, 2));
}

function isDuplicate(title) {
  const posted = getPosted();
  if (posted.includes(title)) return true;
  posted.push(title); savePosted(posted); return false;
}
function logScam(post, reason) {
  const log = JSON.parse(fs.readFileSync(scamLogFile));
  log.push({ title: post.title, source: post.source, reason, time: new Date().toISOString() });
  fs.writeFileSync(scamLogFile, JSON.stringify(log, null, 2));
}

// ─── SCAM PRE-FILTER (blocks obvious scams before wasting API calls) ──────────
const HARD_SCAM = [
  /send\s+\d+.*get\s+\d+/i,
  /seed\s+phrase|private\s+key|recovery\s+phrase/i,
  /approve\s+(transaction|contract)\s+to\s+claim/i,
  /pay\s+(fee|gas|tax)\s+to\s+(claim|receive|withdraw)/i,
  /double\s+your\s+(eth|bnb|sol|crypto)/i,
  /elon\s+(musk|tesla).*giveaway/i,
  /vitalik.*giveaway/i,
  /\b(etherum|ethreum|binnance|binanse|solona)\b/i,
];

function isHardScam(text) {
  return HARD_SCAM.some(p => p.test(text));
}

// ─── WEB RESEARCH ─────────────────────────────────────────────────────────────

// Search Google via SerpAPI (free tier: 100/month) or fallback to DuckDuckGo
async function searchWeb(query) {
  if (SERP_KEY) {
    try {
      const res = await axios.get("https://serpapi.com/search", {
        params: { q: query, api_key: SERP_KEY, num: 5, engine: "google" },
        timeout: 8000,
      });
      return (res.data.organic_results || [])
        .slice(0, 5)
        .map(r => `${r.title}: ${r.snippet}`)
        .join("\n");
    } catch { /* fall through */ }
  }

  // Free fallback: DuckDuckGo instant answer API
  try {
    const res = await axios.get("https://api.duckduckgo.com/", {
      params: { q: query, format: "json", no_html: 1, skip_disambig: 1 },
      timeout: 8000,
    });
    const d = res.data;
    const parts = [];
    if (d.AbstractText) parts.push(d.AbstractText);
    if (d.RelatedTopics) {
      d.RelatedTopics.slice(0, 4).forEach(t => t.Text && parts.push(t.Text));
    }
    return parts.join("\n") || "";
  } catch { return ""; }
}

// Check CoinGecko for token data
async function checkCoinGecko(projectName) {
  try {
    const search = await axios.get(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(projectName)}`,
      { timeout: 6000 }
    );
    const coin = search.data.coins?.[0];
    if (!coin) return null;

    // Get more detail
    const detail = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${coin.id}?localization=false&tickers=false&community_data=false&developer_data=false`,
      { timeout: 6000 }
    );
    const d = detail.data;
    return {
      name:        d.name,
      symbol:      d.symbol?.toUpperCase(),
      market_cap:  d.market_data?.market_cap?.usd
                     ? `$${(d.market_data.market_cap.usd / 1e6).toFixed(1)}M`
                     : null,
      price:       d.market_data?.current_price?.usd
                     ? `$${d.market_data.current_price.usd}`
                     : null,
      website:     d.links?.homepage?.[0] || null,
      twitter:     d.links?.twitter_screen_name
                     ? `https://twitter.com/${d.links.twitter_screen_name}`
                     : null,
      description: d.description?.en?.slice(0, 200) || null,
      categories:  d.categories?.slice(0, 3).join(", ") || null,
      listed:      true,
    };
  } catch { return null; }
}

// Scrape project website for basic info
async function scrapeProjectSite(url) {
  try {
    const res = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 7000,
    });
    const $ = cheerio.load(res.data);
    const title = $("title").text().trim();
    const desc  = $('meta[name="description"]').attr("content") || "";
    const ogDesc = $('meta[property="og:description"]').attr("content") || "";
    return { title, description: ogDesc || desc };
  } catch { return null; }
}

// ─── AI RESEARCHER (OpenAI) ───────────────────────────────────────────────────
async function aiResearch(rawPost, webData, coinData) {
  const coinSection = coinData
    ? `CoinGecko Data: ${JSON.stringify(coinData)}`
    : "CoinGecko: Not listed yet (new project)";

  const prompt = `You are a professional crypto analyst who writes airdrop guides for a serious Telegram channel with 100k+ followers.

You have been given a raw airdrop post and research data. Your job is to:
1. Verify if this is a real, legitimate project
2. Extract all key information
3. Write a clean, structured Telegram post exactly like the format below

RAW POST:
"""
${rawPost}
"""

RESEARCH DATA:
${webData ? `Web Search Results:\n${webData}\n` : "Web: No results found\n"}
${coinSection}

OUTPUT FORMAT (respond ONLY with valid JSON, no markdown):
{
  "is_legitimate": true or false,
  "legitimacy_reason": "one sentence why you think it's real or fake",
  "confidence": 0-100,
  "verdict": "VERIFIED" or "UNVERIFIED" or "SCAM",
  
  "project_name": "exact project name",
  "token_symbol": "$TOKEN or null",
  "category": "Testnet" or "Airdrop" or "NFT" or "DeFi" or "Campaign" or "Claim Live",
  "category_emoji": "🧪" or "🪂" or "🖼" or "💰" or "📣" or "⚡",
  
  "description": "2 sentences about what the project does, in simple English",
  "funding": "e.g. $50M at $500M FDV or null",
  "backers": "e.g. Sequoia, Paradigm or null",
  "incubated_by": "e.g. Stripe or null",
  "partnerships": "comma separated list or null",
  
  "tge": "e.g. Q2 2025 or null",
  "airdrop_confirmed": true or false,
  "referral_system": true or false,
  "rating": "X/10 — one line reason (only give if VERIFIED, else null)",
  
  "team": [
    { "name": "Full Name", "role": "Title" }
  ],
  
  "tasks": [
    "Step 1 description",
    "Step 2 description"
  ],
  
  "links": [
    { "label": "Official Website", "url": "https://..." },
    { "label": "App / Testnet", "url": "https://..." }
  ],
  
  "risk_note": "one sentence warning if any risk, or null",
  "post_type": "GUIDE" or "UPDATE" or "ALERT"
}

RULES:
- If the project asks for private keys, seed phrases, or upfront payment → verdict = SCAM
- If you cannot find ANY online presence for the project → verdict = UNVERIFIED
- Only give a rating of 7+ if there is real funding, team, and confirmed airdrop
- Be concise and factual. Never invent information.`;

  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const raw = res.data.choices[0].message.content.trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.log("   ⚠️  OpenAI error:", err.message);
    return null;
  }
}

// ─── FULL RESEARCH PIPELINE ───────────────────────────────────────────────────
async function researchProject(rawPost) {
  // Extract project name for searching
  const nameMatch =
    rawPost.match(/([A-Z][a-zA-Z0-9]+(?:\s[A-Z][a-zA-Z0-9]+)?)\s+(?:Airdrop|Testnet|Guide|Protocol|Finance|Network)/i) ||
    rawPost.match(/\$([A-Z]{2,8})\b/) ||
    rawPost.match(/([A-Z][a-zA-Z0-9]{3,})\s*:/);

  const projectName = nameMatch ? nameMatch[1].trim() : "";
  const cacheKey = projectName.toLowerCase().replace(/\s+/g, "_");

  // Use cache to avoid re-researching same project
  const cache = getCache();
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < 3600000) {
    console.log(`   💾 Using cached research for: ${projectName}`);
    return cache[cacheKey].data;
  }

  console.log(`   🔬 Researching: ${projectName || "unknown project"}`);

  // Run research in parallel
  const [webData, coinData] = await Promise.all([
    projectName
      ? searchWeb(`${projectName} crypto airdrop testnet 2024 2025 official`)
      : Promise.resolve(""),
    projectName ? checkCoinGecko(projectName) : Promise.resolve(null),
  ]);

  // Try to scrape official site if CoinGecko has it
  let siteData = null;
  if (coinData?.website) {
    siteData = await scrapeProjectSite(coinData.website);
  }

  const combinedWeb = [webData, siteData?.description].filter(Boolean).join("\n");

  // AI analysis with all research data
  const analysis = await aiResearch(rawPost, combinedWeb, coinData);

  if (analysis) {
    setCache(cacheKey, { data: analysis, timestamp: Date.now() });
  }

  return analysis;
}

// ─── POST FORMATTERS ──────────────────────────────────────────────────────────
function formatGuidePost(a, source) {
  const lines = [];

  lines.push(`${a.category_emoji} <b>${a.project_name} : ${a.category}</b>`);
  if (a.verdict === "UNVERIFIED") {
    lines.push(`⚠️ <i>Project not fully verified — proceed with caution</i>`);
  }
  lines.push(`<i>New users can also join ——</i>\n`);

  if (a.funding)      lines.push(`💰 <b>Funding :</b> ${a.funding}`);
  if (a.incubated_by) lines.push(`🏗 <b>Incubated by</b> ${a.incubated_by}`);
  if (a.backers)      lines.push(`🤝 <b>Backed by :</b> ${a.backers}`);
  if (a.partnerships) lines.push(`🔗 <b>Partnerships:</b> ${a.partnerships}\n`);

  if (a.description)  lines.push(`📌 <b>Project</b> - ${a.description}\n`);

  lines.push(`👤 <b>Users</b> - No Info`);
  lines.push(`✅ <b>Airdrop Confirmation</b> - ${a.airdrop_confirmed ? "Yes" : "No"}`);
  lines.push(`👥 <b>Referral System</b> - ${a.referral_system ? "Yes" : "No"}`);
  if (a.tge)    lines.push(`📅 <b>Expected TGE</b> - ${a.tge}`);
  if (a.rating) lines.push(`⭐ <b>Airdrop Rating</b> - ${a.rating}\n`);

  if (a.team?.length) {
    lines.push(`👨‍💻 <b>Team :</b>`);
    a.team.forEach(m => lines.push(`  ${m.name} : ${m.role}`));
    lines.push("");
  }

  if (a.tasks?.length) {
    lines.push(`📋 <b>Steps</b>`);
    a.tasks.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
    lines.push("");
  }

  if (a.links?.length) {
    lines.push(`🌐 <b>All the Links</b>`);
    a.links.forEach((l, i) => lines.push(`${i + 1}. <a href="${l.url}">${l.label}</a>`));
  }

  if (a.risk_note) lines.push(`\n⚠️ <i>${a.risk_note}</i>`);

  lines.push(`\n━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`🤖 <i>AirdropHunter Bot | ${a.verdict === "VERIFIED" ? "✅ Verified" : "⚠️ Unverified"}</i>`);

  return lines.join("\n");
}

function formatUpdatePost(a, source) {
  const lines = [];

  lines.push(`${a.category_emoji} <b>${a.project_name}</b> — ${a.category}`);
  if (a.verdict === "UNVERIFIED") lines.push(`⚠️ <i>Not fully verified</i>`);
  lines.push("");

  if (a.description) lines.push(`${a.description}\n`);

  if (a.tasks?.length) {
    a.tasks.forEach(t => lines.push(`• ${t}`));
    lines.push("");
  }

  if (a.links?.length) {
    lines.push(`🔗 <b>Link :</b> <a href="${a.links[0].url}">${a.links[0].url}</a>`);
    a.links.slice(1).forEach(l => lines.push(`• <a href="${l.url}">${l.label}</a>`));
  }

  if (a.risk_note) lines.push(`\n⚠️ <i>${a.risk_note}</i>`);

  lines.push(`\n━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`🤖 <i>AirdropHunter Bot | ${a.verdict === "VERIFIED" ? "✅ Verified" : "⚠️ Unverified"}</i>`);

  return lines.join("\n");
}

function buildTelegramMessage(analysis, source) {
  if (!analysis) return null;
  if (analysis.post_type === "UPDATE") return formatUpdatePost(analysis, source);
  return formatGuidePost(analysis, source);
}

// ─── TELEGRAM SENDER ──────────────────────────────────────────────────────────
async function sendTelegram(text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(url, { chat_id: CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: false });
    console.log("   ✅ Sent to Telegram");
  } catch (err) {
    console.log("   ❌ Telegram error:", err.response?.data?.description || err.message);
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
        if (!text || text.length < 40) return;
        const lower = text.toLowerCase();
        if (
          lower.includes("airdrop") || lower.includes("testnet") ||
          lower.includes("campaign") || lower.includes("whitelist") ||
          lower.includes("early access") || lower.includes("retroactive") ||
          lower.includes("claim") || lower.includes("tge") ||
          lower.includes("free mint") || lower.includes("sbt")
        ) {
          results.push({ title: text.slice(0, 2000), source: webUrl });
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
  console.log("🚀 AirdropHunter Bot — AI Research Mode\n");

  const posts = await scanTelegramChannels();
  if (posts.length === 0) { console.log("😴 No posts found."); return; }

  let sent = 0, skipped = 0;

  for (const post of posts) {
    if (isDuplicate(post.title)) { console.log("⏭  Duplicate, skipping."); continue; }

    // Step 1: Hard scam pre-filter
    if (isHardScam(post.title)) {
      logScam(post, "Hard scam pattern matched");
      console.log(`🚫 Hard scam blocked immediately.\n`);
      skipped++; continue;
    }

    console.log(`\n📝 Processing: "${post.title.slice(0, 70)}..."`);

    // Step 2: Full AI research
    const analysis = await researchProject(post.title);

    if (!analysis) {
      console.log("   ⚠️  Research failed, skipping.");
      skipped++; continue;
    }

    console.log(`   → Verdict: ${analysis.verdict} | Confidence: ${analysis.confidence}% | Type: ${analysis.post_type}`);

    // Step 3: Block confirmed scams
    if (analysis.verdict === "SCAM") {
      logScam(post, analysis.legitimacy_reason);
      console.log(`   🚫 AI flagged as SCAM: ${analysis.legitimacy_reason}`);
      skipped++; continue;
    }

    // Step 4: Format and send (UNVERIFIED posts go through with warning label)
    const message = buildTelegramMessage(analysis, post.source);
    if (!message) { skipped++; continue; }

    await sendTelegram(message);
    sent++;

    // Respect Telegram rate limit
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`\n✅ Done — Sent: ${sent} | Blocked/Skipped: ${skipped}`);
}

main();
