const axios = require("axios");
const cheerio = require("cheerio");

async function researchProject(name, link) {

    try {

        const res = await axios.get(link);
        const $ = cheerio.load(res.data);

        let twitter = null;
        let website = null;

        $("a").each((i, el) => {

            const href = $(el).attr("href");
            if (!href) return;

            // -------- FILTER BAD LINKS --------
            if (
                href.includes("coingecko") ||
                href.includes("coinmarketcap") ||
                href.includes("youtube") ||
                href.includes("t.me") ||
                href.includes("discord.gg") ||
                href.includes("reddit")
            ) {
                return;
            }

            // -------- FIND PROJECT TWITTER --------
            if (
                !twitter &&
                (href.includes("twitter.com/") || href.includes("x.com/"))
            ) {
                twitter = href;
            }

            // -------- FIND PROJECT WEBSITE --------
            if (
                !website &&
                href.startsWith("http") &&
                !href.includes("twitter") &&
                !href.includes("x.com")
            ) {
                website = href;
            }

        });

        // if important info missing → skip project
        if (!twitter || !website) {
            return null;
        }

        return {
            name,
            link,
            twitter,
            website
        };

    } catch (err) {

        console.log("Research failed:", name);
        return null;

    }

}

module.exports = researchProject;
