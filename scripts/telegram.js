const axios = require('axios');

async function sendTelegram(message) {
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = process.env.CHAT_ID;
    
    // Safety: Telegram crashes if HTML tags aren't closed or have illegal characters
    const safeMessage = message
        .replace(/&(?!(amp|lt|gt|quot|apos);)/g, '&amp;') 
        .replace(/<(?!\/?(b|i|a|pre|code|u|s|strike|del|strong|em)>)/g, '&lt;')
        .replace(/>(?<!<(b|i|a|pre|code|u|s|strike|del|strong|em)\b[^>]*) /g, '&gt;');

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    try {
        await axios.post(url, {
            chat_id: CHAT_ID,
            text: safeMessage,
            parse_mode: 'HTML',
            disable_notification: false, // 🔔 This forces the notification sound
            disable_web_page_preview: false
        });
        console.log("✅ Alpha sent to Telegram!");
    } catch (error) {
        console.error("❌ Telegram Error:", error.response ? error.response.data : error.message);
    }
}

module.exports = sendTelegram;
