const https = require("https");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

function sendTelegram(message) {
  const data = JSON.stringify({
    chat_id: CHAT_ID,
    text: message
  });

  const options = {
    hostname: "api.telegram.org",
    path: `/bot${BOT_TOKEN}/sendMessage`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": data.length
    }
  };

  const req = https.request(options);
  req.write(data);
  req.end();
}

https.get(
  "https://api.github.com/search/repositories?q=blockchain+testnet&sort=updated",
  { headers: { "User-Agent": "airdrop-bot" } },
  res => {
    let data = "";

    res.on("data", chunk => (data += chunk));

    res.on("end", () => {
      const repos = JSON.parse(data).items.slice(0,5);

      repos.forEach(repo => {
        const message =
`🚨 Potential Airdrop Project

Project: ${repo.name}
Repo: ${repo.html_url}`;

        sendTelegram(message);
      });
    });
  }
);
