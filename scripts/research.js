const axios = require("axios");

async function researchProject(name) {

    try {

        // search project on coingecko
        const search = await axios.get(
            `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(name)}`
        );

        if (!search.data.coins.length) {
            return null;
        }

        const coinId = search.data.coins[0].id;

        // get detailed project data
        const res = await axios.get(
            `https://api.coingecko.com/api/v3/coins/${coinId}`
        );

        const coin = res.data;

        const website = coin.links.homepage[0];
        const twitter = coin.links.twitter_screen_name
            ? `https://x.com/${coin.links.twitter_screen_name}`
            : null;

        if (!website || !twitter) {
            return null;
        }

        return {
            name: coin.name,
            website: website,
            twitter: twitter,
            gecko: `https://www.coingecko.com/en/coins/${coinId}`
        };

    } catch (err) {

        console.log("Research failed:", name);
        return null;

    }

}

module.exports = researchProject;
