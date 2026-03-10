const https = require("https");

function scanNews(callback){

  https.get(
    "https://min-api.cryptocompare.com/data/v2/news/?lang=EN",
    res=>{

      let body="";

      res.on("data",chunk=>body+=chunk);

      res.on("end",()=>{

        const data = JSON.parse(body);

        const projects = data.Data.slice(0,2).map(n=>({
          name:n.title,
          link:n.url
        }));

        callback(projects);

      });

    }
  );

}

module.exports = scanNews;
