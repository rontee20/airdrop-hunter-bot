const https = require("https");

function scanGalxe(callback) {

  const options = {
    hostname: "graphigo.prd.galaxy.eco",
    path: "/query",
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  };

  const req = https.request(options, res => {

    let body = "";

    res.on("data", chunk => body += chunk);

    res.on("end", () => {
      const data = JSON.parse(body);
      callback(data);
    });

  });

  req.write(JSON.stringify({
    query: "{ campaigns { name id } }"
  }));

  req.end();
}

module.exports = scanGalxe;
