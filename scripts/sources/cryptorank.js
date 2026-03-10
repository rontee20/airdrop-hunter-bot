const axios = require("axios");
const cheerio = require("cheerio");

async function scanCryptoRank() {

    try {

        const res = await axios.get("https://cryptorank.io/airdrops", {
            timeout: 10000,
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        const $ = cheerio.load(res.data);

        const projects = [];

        $("a[href*='/airdrops/']").each((i, el) => {

            const name = $(el).text().trim();
            const link = $(el).attr("href");

            if (name && name.length > 3) {

                projects.push({
                    name,
                    link: "https://cryptorank.io" + link,
                    source: "CryptoRank"
                });

            }

        });

        console.log("CryptoRank detected:", projects.length);

        return projects;

    } catch (err) {

        console.log("CryptoRank failed — skipping");

        return [];

    }

}

module.exports = scanCryptoRank;
