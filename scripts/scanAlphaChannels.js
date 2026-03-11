import axios from "axios";
import cheerio from "cheerio";

const channels = [
  "https://t.me/s/airdrops_io",
  "https://t.me/s/CryptoRank_io",
  "https://t.me/s/Cointelegraph",
  "https://t.me/s/ICOAnalytics"
];

export async function scanAlphaChannels() {

  let results = [];

  for (const url of channels) {

    try {

      const res = await axios.get(url);
      const $ = cheerio.load(res.data);

      $(".tgme_widget_message_text").each((i, el) => {

        const text = $(el).text();

        if (
          text.toLowerCase().includes("airdrop") ||
          text.toLowerCase().includes("testnet") ||
          text.toLowerCase().includes("campaign")
        ) {

          results.push({
            name: text.slice(0,80),
            website: url,
            twitter: "",
            tasks: "follow discord testnet"
          });

        }

      });

    } catch (err) {

      console.log("Channel scan error:", url);

    }
  }

  return results;
}
