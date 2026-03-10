const https = require("https");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

console.log("Token:", BOT_TOKEN);
console.log("Chat:", CHAT_ID);

const data = JSON.stringify({
  chat_id: CHAT_ID,
  text: "🚀 TEST MESSAGE FROM GITHUB BOT"
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
  console.log("STATUS:", res.statusCode);
});

req.write(data);
req.end();
