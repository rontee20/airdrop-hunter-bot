const axios = require("axios");

async function scanGithub() {

    try {

        const res = await axios.get(
            "https://api.github.com/search/repositories?q=crypto+blockchain+defi&sort=updated&order=desc&per_page=20"
        );

        const repos = res.data.items;

        const projects = repos.map(repo => ({
            name: repo.name,
            link: repo.html_url,
            source: "GitHub"
        }));

        return projects;

    } catch (err) {

        console.log("GitHub scan error:", err.message);
        return [];

    }

}

module.exports = scanGithub;
