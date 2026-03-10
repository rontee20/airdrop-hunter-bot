const axios = require("axios");

async function tokenCheck(name) {

    try {

        const res = await axios.get(
            `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(name)}`
        );

        if (res.data.coins.length > 0) return true;

        return false;

    } catch {

        return false;

    }

}

module.exports = tokenCheck;
