const axios = require("axios");
const cheerio = require("cheerio");

async function scanCryptoRank() {

    try {

        const res = await axios.get("https://cryptorank.io/airdrops");

        const html = res.data;

        const cheerio = require("cheerio");
        const $ = cheerio.load(html);

        const projects = [];

        $("a").each((i, el) => {

            const name = $(el).text().trim();
            const link = $(el).attr("href");

            if (name.length > 3 && link && link.includes("/airdrops/")) {

                projects.push({
                    name,
                    link: "https://cryptorank.io" + link,
                    source: "CryptoRank"
                });

            }

        });

        return projects;

    } catch (err) {

        console.log("CryptoRank scan error:", err.message);
        return [];

    }

}

module.exports = scanCryptoRank;
