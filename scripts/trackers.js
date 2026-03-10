const https = require("https");

function scanTrackers(callback){

  https.get(
    "https://api.coingecko.com/api/v3/search/trending",
    { headers:{ "User-Agent":"airdrop-bot"} },
    res => {

      let body="";

      res.on("data",chunk=>body+=chunk);

      res.on("end",()=>{

        const data = JSON.parse(body);

        const projects = data.coins.map(c=>({
          name: c.item.name,
          link: "https://www.coingecko.com/en/coins/"+c.item.id
        }));

        callback(projects);

      });

    }
  );

}

module.exports = scanTrackers;
