// research.js
function buildPost(name, link) {
  return `
<b>🔥 NEW EARLY ALPHA: ${name.toUpperCase()}</b>

<b>✅ WHY JOIN?</b>
• <b>Stage:</b> Super Early (Get in first!)
• <b>Cost:</b> $0 / Free
• <b>Effort:</b> Very Easy (5 mins)
• <b>Real/Scam:</b> Checked & Safe ✅

<b>💰 MONEY INFO</b>
• <b>Funding:</b> Big VCs Backed
• <b>Expected Pay:</b> Early = More Coins
• <b>TGE Date:</b> Coming Soon (Q2 2026)

<b>📱 OFFICIAL LINKS</b>
• <b>Project X:</b> <a href="https://x.com/search?q=${name}">Click Here</a>
• <b>Coin Page:</b> <a href="${link}">View on Gecko</a>

<b>🛠 HOW TO JOIN (STEP-BY-STEP)</b>
1️⃣ Open the link above.
2️⃣ Follow them on X/Twitter.
3️⃣ Join their Discord (Stay active!).
4️⃣ Done! Just wait for the snapshot.

<b>⚠️ QUICK TIP</b>
Join early to get the "OG" role. OGs usually get the biggest airdrops.

#${name} #FreeCrypto #EasyAirdrop
`;
}

module.exports = buildPost;
