const axios = require("axios");

async function tokenCheck(name) {

    try {

        const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(name)}`;

        const res = await axios.get(url);

        if (res.data.coins && res.data.coins.length > 0) {

            return true; // token exists

        }

        return false;

    } catch (err) {

        console.log("Token check error:", name);
        return false;

    }

}

module.exports = tokenCheck;
