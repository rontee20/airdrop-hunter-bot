function buildPost(name, link, status) {

return `
<b>🚀 NEW ALPHA: ${name.toUpperCase()}</b>
<pre>Status: ${status || "Standard Project"}</pre>

<b>✅ WHY JOIN?</b>
• <b>Stage:</b> Super Early
• <b>Cost:</b> $0 / Free
• <b>Effort:</b> Easy (5 mins)
• <b>Real/Scam:</b> Verified Safe ✅

<b>💰 MONEY INFO</b>
• <b>Funding:</b> VC Backed / High TVL
• <b>Expected Pay:</b> Early = More Coins

<b>📱 OFFICIAL LINKS</b>
• <b>Project X:</b> <a href="https://x.com/search?q=${encodeURIComponent(name)}">Search on X</a>
• <b>Data:</b> <a href="${link}">View on Gecko</a>

<b>🛠 HOW TO JOIN (EASY)</b>
1️⃣ Open the link above.
2️⃣ Follow them on X/Twitter.
3️⃣ Join their Discord.
4️⃣ Done! Stay active.

<i>⚠️ Always DYOR. High volatility.</i>
`;
}

module.exports = buildPost;
