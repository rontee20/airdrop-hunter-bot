const axios = require("axios");

async function scanGalxe() {

    try {

        const res = await axios.get(
            "https://graphigo.prd.galaxy.eco/query"
        );

        // placeholder until GraphQL query added
        return [];

    } catch (err) {

        console.log("Galxe failed — skipping");
        return [];

    }

}

module.exports = scanGalxe;
