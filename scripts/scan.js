  const https = require("https");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

function sendTelegram(text) {
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
    let response = "";

    res.on("data", chunk => {
      response += chunk;
    });

    res.on("end", () => {
      console.log("Telegram response:", response);
    });
  });

  req.on("error", error => {
    console.error("Telegram error:", error);
  });

  req.write(data);
  req.end();
}

https.get(
  "https://api.github.com/search/repositories?q=blockchain&sort=updated",
  { headers: { "User-Agent": "airdrop-hunter-bot" } },
  res => {
    let body = "";

    res.on("data", chunk => {
      body += chunk;
    });

    res.on("end", () => {
      const repos = JSON.parse(body).items.slice(0, 3);

      repos.forEach(repo => {
        const message =
          "🚨 Potential Crypto Project\n" +
          "Name: " + repo.name + "\n" +
          "Repo: " + repo.html_url;

        sendTelegram(message);
      });
    });
  }
); 
