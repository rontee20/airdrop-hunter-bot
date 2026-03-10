const axios = require("axios");

async function scanCryptoRank() {

    try {

        const res = await axios.get(
            "https://api.cryptorank.io/v1/airdrops?limit=20"
        );

        const projects = res.data.data.map(p => ({
            name: p.name,
            link: p.website || p.url,
            source: "CryptoRank"
        }));

        return projects;

    } catch (err) {

        console.log("CryptoRank scan error");
        return [];

    }

}

module.exports = scanCryptoRank;
