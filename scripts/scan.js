import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

import { telegramChannels } from "../config/sources.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const postedFile = "data/posted.json";

if (!fs.existsSync(postedFile)) {
  fs.writeFileSync(postedFile, JSON.stringify([]));
}

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

const scamKeywords = [
  "free usdc",
  "giveaway",
  "voucher",
  "bonus",
  "promo",
  "claim reward",
  "referral",
  "instant withdraw"
];

const alphaKeywords = [
  "testnet",
  "incentivized",
  "galxe",
  "zealy",
  "bridge",
  "swap",
  "staking",
  "node",
  "campaign"
];

function isScam(text) {
  const lower = text.toLowerCase();
  return scamKeywords.some(word => lower.includes(word));
}

function isAlpha(text) {
  const lower = text.toLowerCase();
  return alphaKeywords.some(word => lower.includes(word));
}

function extractWebsite(text) {

  const match = text.match(/https?:\/\/[^\s]+/);

  if (!match) return null;

  const url = match[0];

  if (
    url.includes("t.me") ||
    url.includes("bit.ly") ||
    url.includes("ref") ||
    url.includes("airdrop")
  ) return null;

  return url;
}

async function sendTelegram(message) {

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  await axios.post(url, {
    chat_id: CHAT_ID,
    text: message,
    parse_mode: "HTML",
    disable_web_page_preview: false
  });

}

function formatPost(project, website, source) {

return `🚀 <b>New Potential Airdrop</b>

<b>Project:</b>
${project}

🌐 <b>Website</b>
${website}

🐦 <b>X</b>
Search project name on X

🪂 <b>Possible Tasks</b>
• Follow X
• Join Discord
• Complete campaign tasks
• Interact with testnet

⚠️ Always DYOR before interacting.

<b>Source:</b>
${source}

#Crypto #Airdrop #Testnet`;
}

async function scanTelegramChannels() {

  let results = [];

  for (const url of telegramChannels) {

    try {

      const res = await axios.get(url);
      const $ = cheerio.load(res.data);

      $(".tgme_widget_message_text").each((i, el) => {

        const text = $(el).text().trim();

        if (!text) return;

        if (isScam(text)) return;

        if (!isAlpha(text)) return;

        const website = extractWebsite(text);

        if (!website) return;

        const project = text.split(" ")[0].replace("$","");

        results.push({
          project,
          website,
          source: url
        });

      });

    } catch {

      console.log("Channel scan error:", url);

    }

  }

  return results;
}

async function main() {

  console.log("Scanning alpha sources...");

  const posts = await scanTelegramChannels();

  for (const post of posts) {

    if (isDuplicate(post.project)) continue;

    const message = formatPost(
      post.project,
      post.website,
      post.source
    );

    console.log("Posting:", post.project);

    await sendTelegram(message);

  }

}

main();
