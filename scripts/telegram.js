const axios = require("axios");

async function sendTelegram(message) {

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = process.env.CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
        console.log("Telegram token or chat id missing");
        return;
    }

    try {

        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

        const res = await axios.post(url, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: "HTML"
        });

        console.log("Telegram message sent");

    } catch (err) {

        console.log("Telegram error:", err.response?.data || err.message);

    }

}

module.exports = { sendTelegram };
