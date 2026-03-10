const axios = require("axios");
const cheerio = require("cheerio");

async function scanAirdrops() {

    try {

        const res = await axios.get("https://airdrops.io/");

        const $ = cheerio.load(res.data);

        const projects = [];

        $(".airdrop-item").each((i, el) => {

            const name = $(el).find("h3").text().trim();
            const link = $(el).find("a").attr("href");

            if (name && link) {

                projects.push({
                    name,
                    link,
                    source: "airdrops.io"
                });

            }

        });

        console.log("Airdrops detected:", projects.length);

        return projects;

    } catch (err) {

        console.log("Airdrops scan error");
        return [];

    }

}

module.exports = scanAirdrops;
