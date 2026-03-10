const axios = require("axios");
const cheerio = require("cheerio");

async function scanAirdrops(callback) {

    try {

        const res = await axios.get("https://airdrops.io");

        const $ = cheerio.load(res.data);

        const projects = [];

        $(".airdrop-item").each((i, el) => {

            const name = $(el).find(".airdrop-title").text().trim();
            const link = $(el).find("a").attr("href");

            if (name && link) {

                projects.push({
                    name,
                    link
                });

            }

        });

        callback(projects);

    } catch (err) {

        console.log("Airdrops.io scan error");

    }

}

module.exports = scanAirdrops;
