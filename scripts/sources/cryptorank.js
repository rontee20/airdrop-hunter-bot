const axios = require("axios");
const cheerio = require("cheerio");

async function scanCryptoRank() {

    try {

        const url = "https://cryptorank.io/airdrops";

        const res = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            },
            timeout: 15000
        });

        const $ = cheerio.load(res.data);

        const projects = [];

        $("a").each((i, el) => {

            const name = $(el).text().trim();
            const link = $(el).attr("href");

            if (!name || !link) return;

            if (!link.includes("/airdrops/")) return;

            if (name.length < 3) return;

            projects.push({
                name: name,
                link: "https://cryptorank.io" + link,
                source: "CryptoRank"
            });

        });

        const unique = [];

        const seen = new Set();

        for (const p of projects) {

            if (!seen.has(p.name)) {

                seen.add(p.name);
                unique.push(p);

            }

        }

        console.log("CryptoRank detected:", unique.length);

        return unique;

    } catch (err) {

        console.log("CryptoRank failed — skipping");

        return [];

    }

}

module.exports = scanCryptoRank;
