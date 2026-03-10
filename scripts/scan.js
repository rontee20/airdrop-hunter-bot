const axios = require("axios");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

async function sendTelegram(message) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    try {
        await axios.post(url, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: "Markdown"
        });

        console.log("📩 Telegram message sent");
    } catch (err) {
        console.log("Telegram error:", err.message);
    }
}

module.exports = { sendTelegram };
