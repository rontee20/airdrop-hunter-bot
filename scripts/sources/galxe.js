const axios = require("axios");

async function scanGalxe() {

    try {

        const res = await axios.get(
            "https://graphigo.prd.galaxy.eco/query"
        );

        return [];

    } catch (err) {

        console.log("Galxe scan error");
        return [];

    }

}

module.exports = scanGalxe;
