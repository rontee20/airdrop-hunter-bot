const https = require("https");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

function sendTelegram(text){

  const data = JSON.stringify({
    chat_id: CHAT_ID,
    text: text
  });

  const options = {
    hostname: "api.telegram.org",
    path: `/bot${BOT_TOKEN}/sendMessage`,
    method: "POST",
    headers:{
      "Content-Type":"application/json",
      "Content-Length": data.length
    }
  };

  const req = https.request(options);
  req.write(data);
  req.end();
}

module.exports = sendTelegram;
