const axios = require("axios");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

async function sendTelegram(message) {

    if (!BOT_TOKEN || !CHAT_ID) {
        console.log("Telegram config missing");
        return;
    }

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    try {

        const res = await axios.post(url, {
            chat_id: CHAT_ID,
            text: message
        });

        console.log("Telegram sent:", res.data);

    } catch (err) {

        console.log("Telegram error:", err.response?.data || err.message);

    }
}

module.exports = { sendTelegram };
