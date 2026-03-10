const https = require("https");

function scanZealy(callback) {

  https.get(
    "https://api.zealy.io/public/communities",
    res => {

      let body = "";

      res.on("data", chunk => body += chunk);

      res.on("end", () => {
        const data = JSON.parse(body);
        callback(data);
      });

    }
  );

}

module.exports = scanZealy;
