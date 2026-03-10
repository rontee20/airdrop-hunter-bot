const axios = require("axios");

async function tokenCheck(name) {

    try {

        // CoinGecko check
        const gecko = await axios.get(
            `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(name)}`
        );

        if (gecko.data.coins && gecko.data.coins.length > 0) {
            return true;
        }

        // CoinMarketCap check
        const cmc = await axios.get(
            `https://api.coincap.io/v2/assets?search=${encodeURIComponent(name)}`
        );

        if (cmc.data.data && cmc.data.data.length > 0) {
            return true;
        }

        return false;

    } catch (err) {

        console.log("Token check skipped:", name);
        return false;

    }

}

module.exports = tokenCheck;
