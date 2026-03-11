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

async function sendTelegram(text) {

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {

    const res = await axios.post(url,{
      chat_id: CHAT_ID,
      text: text,
      parse_mode: "HTML"
    });

    console.log("Telegram sent");

  } catch (err) {

    console.log("Telegram error:", err.response?.data || err.message);

  }

}

function formatPost(title, source) {

return `🚀 <b>Crypto Alpha Detected</b>

<b>Project Info</b>
${title}

🔎 <b>Source</b>
${source}

⚡ Early alpha spotted.

`;
}

async function scanTelegramChannels() {

  let results = [];

  for (const url of telegramChannels) {

    try {

      console.log("Scanning:", url);

      const res = await axios.get(url);
      const $ = cheerio.load(res.data);

      $(".tgme_widget_message_text").each((i, el) => {

        const text = $(el).text().trim();

        if (!text) return;

        if (
          text.toLowerCase().includes("airdrop") ||
          text.toLowerCase().includes("testnet") ||
          text.toLowerCase().includes("campaign")
        ) {

          results.push({
            title: text.slice(0,120),
            source: url
          });

        }

      });

    } catch (err) {

      console.log("Scan error:", url);

    }

  }

  console.log("Posts found:", results.length);

  return results;
}

async function main(){

  console.log("Starting scan...");

  const posts = await scanTelegramChannels();

  if(posts.length === 0){
    console.log("No posts found");
    return;
  }

  for(const post of posts){

    if(isDuplicate(post.title)) continue;

    const message = formatPost(post.title, post.source);

    await sendTelegram(message);

  }

}

main();
