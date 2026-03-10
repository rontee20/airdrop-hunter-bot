const axios = require("axios");

async function scanCMC(callback) {

    try {

        const res = await axios.get(
            "https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing?start=1&limit=20&sortBy=date_added&sortType=desc"
        );

        const coins = res.data.data.cryptoCurrencyList;

        const projects = coins.map(c => ({
            name: c.name,
            link: `https://coinmarketcap.com/currencies/${c.slug}`
        }));

        callback(projects);

    } catch (err) {

        console.log("CMC scan error:", err.message);

    }

}

module.exports = scanCMC;
