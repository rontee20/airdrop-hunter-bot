import { scanAlphaChannels } from "./scanAlphaChannels.js";
import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const postedFile = "data/posted.json";

if (!fs.existsSync(postedFile)) {
  fs.writeFileSync(postedFile, JSON.stringify([]));
}

function getPosted() {
  return JSON.parse(fs.readFileSync(postedFile));
}

function savePosted(list) {
  fs.writeFileSync(postedFile, JSON.stringify(list, null, 2));
}

function isDuplicate(name) {
  const posted = getPosted();
  return posted.includes(name);
}

function addPosted(name) {
  const posted = getPosted();
  posted.push(name);
  savePosted(posted);
}

function isValidProject(p) {
  if (!p.name) return false;
  if (!p.website) return false;
  if (!p.twitter) return false;

  if (p.token === true) return false;

  const tasks = (p.tasks || "").toLowerCase();

  const allowed = [
    "follow",
    "discord",
    "bridge",
    "swap",
    "stake",
    "galxe",
    "testnet"
  ];

  return allowed.some(t => tasks.includes(t));
}

async function sendTelegram(text) {

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  await axios.post(url, {
    chat_id: CHAT_ID,
    text: text,
    parse_mode: "HTML",
    disable_web_page_preview: false
  });
}

function formatPost(p) {

  return `
🚀 <b>New Potential Airdrop</b>

<b>Project:</b> ${p.name}

🌐 <b>Website</b>
${p.website}

🐦 <b>X</b>
${p.twitter}

🪂 <b>Possible Tasks</b>
• Follow X
• Join Discord
• Bridge testnet
• Complete campaign quests

⚡ Early interaction recommended
`;
}

async function scanCryptoRank() {

  try {

    const url = "https://api.cryptorank.io/v1/airdrops";

    const res = await axios.get(url);

    const data = res.data?.data || [];

    return data.map(p => ({
      name: p.name,
      website: p.website || "",
      twitter: p.twitter || "",
      tasks: "follow discord galxe testnet",
      token: false
    }));

  } catch {

    return [];
  }
}

async function scanAirdrops() {

  try {

    const url = "https://airdrops.io/feed/";

    const res = await axios.get(url);

    return [];

  } catch {

    return [];
  }
}

async function scanNews() {

  try {

    const url = "https://api.coingecko.com/api/v3/search/trending";

    const res = await axios.get(url);

    const coins = res.data?.coins || [];

    return coins.map(c => ({
      name: c.item.name,
      website: `https://www.coingecko.com/en/coins/${c.item.id}`,
      twitter: "",
      tasks: "follow discord",
      token: false
    }));

  } catch {

    return [];
  }
}

async function main() {

  const sources = await Promise.all([
  scanCryptoRank(),
  scanAirdrops(),
  scanNews(),
  scanAlphaChannels()
]);

  const projects = sources.flat();

  for (const p of projects) {

    if (!isValidProject(p)) continue;

    if (isDuplicate(p.name)) continue;

    const post = formatPost(p);

    await sendTelegram(post);

    addPosted(p.name);

    console.log("Posted:", p.name);
  }
}

main();
