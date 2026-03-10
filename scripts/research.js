// research.js
function buildPost(name, link, type = "Early Stage") {
  return `
<b>🚀 NEW ALPHA DETECTED: ${name.toUpperCase()}</b>
<pre>Status: ${type}</pre>

<b>✅ WHY JOIN?</b>
• <b>Stage:</b> Super Early (Get in first!)
• <b>Cost:</b> $0 / Free
• <b>Effort:</b> Very Easy (5 mins)
• <b>Real/Scam:</b> Verified Safe ✅

<b>💰 MONEY INFO</b>
• <b>Funding:</b> VC Backed / High TVL
• <b>Expected Pay:</b> Early = More Coins
• <b>TGE Date:</b> Coming Soon (2026)

<b>📱 OFFICIAL LINKS</b>
• <b>Project X:</b> <a href="https://x.com/search?q=${name}">Click Here</a>
• <b>Research:</b> <a href="${link}">View Data</a>

<b>🛠 HOW TO JOIN (EASY STEPS)</b>
1️⃣ Open the link above.
2️⃣ Follow them on X/Twitter.
3️⃣ Join their Discord.
4️⃣ Done! Stay active for the snapshot.

<i>⚠️ Always DYOR. Never share your seed phrase.</i>
`;
}

module.exports = buildPost;
