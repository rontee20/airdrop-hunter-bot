const axios = require("axios");
const cheerio = require("cheerio");

async function scanAirdrops() {

    try {

        const res = await axios.get("https://airdrops.io/airdrops/");

        const $ = cheerio.load(res.data);

        const projects = [];

        $(".airdrops-list a").each((i, el) => {

            const name = $(el).text().trim();
            const link = $(el).attr("href");

            if (name && link) {

                projects.push({
                    name: name,
                    link: link.startsWith("http")
                        ? link
                        : "https://airdrops.io" + link,
                    source: "airdrops.io"
                });

            }

        });

        console.log("Airdrops detected:", projects.length);

        return projects;

    } catch (err) {

        console.log("Airdrops scan error:", err.message);
        return [];

    }

}

module.exports = scanAirdrops;
