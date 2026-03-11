import axios from "axios";
import * as cheerio from "cheerio";
import { telegramChannels } from "../config/sources.js";

export async function scanAlphaChannels() {

  let results = [];

  for (const url of telegramChannels) {

    try {

      const res = await axios.get(url);
      const $ = cheerio.load(res.data);

      $(".tgme_widget_message_text").each((i, el) => {

        const text = $(el).text();

        if (
          text.toLowerCase().includes("airdrop") ||
          text.toLowerCase().includes("testnet")
        ) {

          results.push({
            name: text.slice(0,80),
            website: url,
            twitter: "",
            tasks: "follow discord testnet"
          });

        }

      });

    } catch {
      console.log("Channel scan error:", url);
    }
  }

  return results;
}
