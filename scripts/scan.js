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

async function sendTelegram(message) {

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {

    await axios.post(url, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: false
    });

  } catch (err) {

    console.log("Telegram send error");

  }

}

function formatPost(title, link) {

  return `
🚀 <b>Crypto Alpha Detected</b>

<b>Source:</b>
${title}

🔗 <b>Link</b>
${link}

⚡ Early alpha spotted from major channels.

#Crypto #Airdrop #Testnet
`;

}

async function scanTelegramChannels() {

  let results = [];

  for (const url of telegramChannels) {

    try {

      const res = await axios.get(url);
      const $ = cheerio.load(res.data);

      $(".tgme_widget_message_text").each((i, el) => {

        const text = $(el).text().trim();

        if (
          text.toLowerCase().includes("airdrop") ||
          text.toLowerCase().includes("testnet") ||
          text.toLowerCase().includes("campaign") ||
          text.toLowerCase().includes("reward")
        ) {

          results.push({
            title: text.slice(0,120),
            link: url
          });

        }

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

    if (isDuplicate(post.title)) continue;

    const message = formatPost(post.title, post.link);

    console.log("Posting:", post.title);

    await sendTelegram(message);

  }

}

main();
