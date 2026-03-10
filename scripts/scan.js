const https = require("https");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

function sendTelegram(message) {

  if (!message) {
    console.log("Message empty, skipping");
    return;
  }

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

  const req = https.request(options, res => {
    let response = "";

    res.on("data", chunk => response += chunk);

    res.on("end", () => {
      console.log("Telegram:", response);
    });
  });

  req.on("error", error => {
    console.error("Error:", error);
  });

  req.write(data);
  req.end();
}

https.get(
  "https://api.github.com/search/repositories?q=blockchain&sort=updated",
  { headers: { "User-Agent": "github-bot" } },
  res => {

    let body = "";

    res.on("data", chunk => body += chunk);

    res.on("end", () => {

      const json = JSON.parse(body);

      const repos = json.items.slice(0,3);

      repos.forEach(repo => {

        const message =
          "🚨 Crypto Project Found\n" +
          "Name: " + repo.name + "\n" +
          "Repo: " + repo.html_url;

        sendTelegram(message);

      });

    });

  }
);
