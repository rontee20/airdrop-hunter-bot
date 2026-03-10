const axios = require("axios");
const cheerio = require("cheerio");

async function scanAirdrops(callback) {

    try {

        const url = "https://airdrops.io/airdrops/";

        const res = await axios.get(url);

        const $ = cheerio.load(res.data);

        const projects = [];

        $(".airdrops-list a").each((i, el) => {

            const name = $(el).text().trim();
            const link = $(el).attr("href");

            if (name && link) {

                projects.push({
                    name: name,
                    link: link.startsWith("http") ? link : "https://airdrops.io" + link
                });

            }

        });

        console.log("Airdrops detected:", projects.length);

        callback(projects);

    } catch (err) {

        console.log("Airdrops.io scan error:", err.message);

        callback([]);

    }

}

module.exports = scanAirdrops;
