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

  const req = https.request(options);
  req.write(data);
  req.end();
}

function fetchAirdrops() {

  const options = {
    hostname: "api.coingecko.com",
    path: "/api/v3/search/trending",
    method: "GET",
    headers: {
      "User-Agent": "airdrop-research-bot"
    }
  };

  https.get(options, res => {

    let body = "";

    res.on("data", chunk => body += chunk);

    res.on("end", () => {

      const data = JSON.parse(body);

      const coins = data.coins.slice(0,2);

      coins.forEach(coin => {

        const project = coin.item.name;
        const symbol = coin.item.symbol;
        const link = "https://www.coingecko.com/en/coins/" + coin.item.id;

        const message =
`📣 ${project} Potential Airdrop Research

⭐ Symbol : ${symbol}
⭐ Source : CoinGecko Trending

🖥 Project Overview
${project} is currently trending in the crypto ecosystem. Trending activity often indicates growing adoption and early ecosystem development which may lead to future token incentives.

📊 Airdrop Confirmation : No
📊 Expected TGE : Unknown

🔗 Research Link
${link}

🔽 Strategy

🟢 Follow the project on X
🟢 Join Discord
🟢 Use early features if available
🟢 Stay active in the ecosystem

⚠️ Always DYOR before interacting with new projects.`;

        sendTelegram(message);

      });

    });

  });

}

fetchAirdrops();
