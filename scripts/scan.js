const https = require("https");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const message = "🚀 Airdrop hunter bot is working!";

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
  console.log("Message sent");
});

req.write(data);
req.end();
