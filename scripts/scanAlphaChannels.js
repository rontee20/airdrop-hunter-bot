import Parser from "rss-parser";

const parser = new Parser();

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

      const feed = await parser.parseURL(url);

      for (const item of feed.items.slice(0,5)) {

        results.push({
          name: item.title,
          website: item.link,
          twitter: "",
          tasks: "follow discord testnet"
        });

      }

    } catch (err) {
      console.log("Channel scan error:", url);
    }
  }

  return results;
}
