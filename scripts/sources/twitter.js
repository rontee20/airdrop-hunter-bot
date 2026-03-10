const axios = require("axios");

async function scanTwitter() {

    try {

        const res = await axios.get(
            "https://api.github.com/search/repositories?q=crypto+defi+protocol&sort=updated&order=desc"
        );

        const projects = res.data.items.slice(0,10).map(repo => ({
            name: repo.name,
            link: repo.html_url,
            source: "Twitter Discovery"
        }));

        return projects;

    } catch (err) {

        console.log("Twitter discovery failed — skipping");
        return [];

    }

}

module.exports = scanTwitter;
