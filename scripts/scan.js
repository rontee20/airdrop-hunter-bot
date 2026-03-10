const https = require("https");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

console.log("BOT_TOKEN:", BOT_TOKEN);
console.log("CHAT_ID:", CHAT_ID);

const message = "GitHub bot test";

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
  let body = "";
  res.on("data", chunk => body += chunk);
  res.on("end", () => console.log(body));
});

req.write(data);
req.end();
