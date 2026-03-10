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

            if (href.includes("twitter.com") || href.includes("x.com")) {
                twitter = href;
            }

            if (
                href.startsWith("http") &&
                !href.includes("coingecko") &&
                !href.includes("coinmarketcap") &&
                !website
            ) {
                website = href;
            }

        });

        // skip if important info missing
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
