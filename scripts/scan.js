const https = require("https");

console.log("Airdrop hunter running...");

https.get(
  "https://api.github.com/search/repositories?q=blockchain+testnet&sort=updated",
  {
    headers: { "User-Agent": "airdrop-bot" }
  },
  res => {
    let data = "";

    res.on("data", chunk => (data += chunk));

    res.on("end", () => {
      const repos = JSON.parse(data).items.slice(0,5);

      repos.forEach(repo => {
        console.log(repo.name + " - " + repo.html_url);
      });
    });
  }
);
