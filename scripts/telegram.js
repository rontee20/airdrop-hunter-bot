async function sendTelegram(message) {

    console.log("Sending message:", message);

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const res = await axios.post(url, {
        chat_id: CHAT_ID,
        text: message
    });

    console.log("Telegram response:", res.data);
}
