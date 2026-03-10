const axios = require("axios");
const cheerio = require("cheerio");

async function researchProject(project) {

    try {

        const res = await axios.get(project.link, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            },
            timeout: 15000
        });

        const $ = cheerio.load(res.data);

        let twitter = null;
        let discord = null;
        let github = null;
        let docs = null;

        $("a").each((i, el) => {

            const href = $(el).attr("href");

            if (!href) return;

            if (!twitter && (href.includes("twitter.com") || href.includes("x.com"))) {
                twitter = href;
            }

            if (!discord && href.includes("discord")) {
                discord = href;
            }

            if (!github && href.includes("github.com")) {
                github = href;
            }

            if (!docs && href.includes("docs")) {
                docs = href;
            }

        });

        // Detect possible tasks
        const tasks = [];

        if (twitter) tasks.push("Follow X");
        if (discord) tasks.push("Join Discord");

        tasks.push("Use Testnet");
        tasks.push("Bridge Testnet");
        tasks.push("Complete Galxe Quest");

        return {
            name: project.name,
            website: project.link,
            twitter,
            discord,
            github,
            docs,
            tasks,
            source: project.source
        };

    } catch (err) {

        console.log("Research failed:", project.name);
        return null;

    }

}

module.exports = researchProject;
