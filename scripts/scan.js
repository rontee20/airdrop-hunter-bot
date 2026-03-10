const https = require("https");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

function sendTelegram(text) {

  if (!text) {
    console.log("Empty message prevented");
    return;
  }

  const data = JSON.stringify({
    chat_id: CHAT_ID,
    text: text
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

  const req = https.request(options, res => {
    let body = "";
    res.on("data", chunk => body += chunk);
    res.on("end", () => console.log(body));
  });

  req.write(data);
  req.end();
}

https.get(
  "https://api.github.com/search/repositories?q=blockchain&sort=updated",
  { headers: { "User-Agent": "github-airdrop-bot" } },
  res => {

    let body = "";

    res.on("data", chunk => body += chunk);

    res.on("end", () => {

      const json = JSON.parse(body);

      if (!json.items) {
        sendTelegram("⚠️ GitHub API returned no results");
        return;
      }

      const repos = json.items.slice(0,3);

      repos.forEach(repo => {

        const name = repo.name || "Unknown project";
        const url = repo.html_url || "No URL";

        const message =
          "🚨 Crypto Project Found\n" +
          "Name: " + name + "\n" +
          "Repo: " + url;

        sendTelegram(message);

      });

    });

  }
);
