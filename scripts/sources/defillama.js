const axios = require("axios");

async function scanDefiLlama() {

    try {

        const res = await axios.get(
            "https://api.llama.fi/protocols"
        );

        const projects = res.data
            .filter(p => p.tvl < 50000000) // early stage projects
            .slice(0, 20)
            .map(p => ({
                name: p.name,
                link: p.url,
                source: "DeFiLlama"
            }));

        return projects;

    } catch (err) {

        console.log("DeFiLlama scan error");
        return [];

    }

}

module.exports = scanDefiLlama;
