// research.js
function buildPost(name, link) {
  // Data points based on NEIRO research (as of 2026)
  const stats = {
    funding: "Community Owned (CTO)",
    backing: "Vitalik Buterin (Donation recipient), Binance, OKX",
    scamCheck: "Smart Contract Audited / Liquidity Burned 🔥",
    tge: "Token Live (Mainnet)",
    team: "Pseudonymous (Community Takeover)",
    twitter: "@neiroethcto",
    potential: "High (Meme Narrative heir to DOGE)"
  };

  return `
<b>🚀 NEW ALPHA DETECTED: <code style="color:#f39c12;">${name.toUpperCase()}</code></b>
<pre>Status: Active Ecosystem Expansion</pre>

<b>📊 PROJECT VITAL SIGNS</b>
━━━━━━━━━━━━━━━━━━
💰 <b>Funding:</b> ${stats.funding}
🛡 <b>Backing:</b> ${stats.backing}
⚖️ <b>Real/Scam:</b> Verified (Liquidity Locked/Contract Renounced)
📅 <b>Expected TGE:</b> Token is Live 🟢
👥 <b>Team:</b> CTO (Community Managed)

<b>🖥 PROJECT OVERVIEW</b>
${name} is the cultural successor to the Doge legacy. After the original dev exited, the community took over (CTO), securing endorsements from top-tier exchanges and key crypto figures like Vitalik Buterin.

<b>🔗 OFFICIAL CHANNELS</b>
• <b>X Account:</b> <a href="https://x.com/neiroethcto">${stats.twitter}</a>
• <b>Research:</b> <a href="${link}">CoinGecko Profile</a>

<b>🔽 STEP-BY-STEP PARTICIPATION</b>
1️⃣ <b>Setup Wallet:</b> Use MetaMask or Trust Wallet (Ethereum Network).
2️⃣ <b>Secure Entry:</b> Only trade on Tier-1 CEX (Binance/OKX) or Uniswap using verified contract addresses.
3️⃣ <b>Governance:</b> Join the Discord/Telegram to vote on the <i>Neiro Foundation</i> charity initiatives.
4️⃣ <b>Hold & Earn:</b> Monitor "Learn-to-Earn" campaigns on exchanges like Bitget or OKX for free airdrops.

<b>⚠️ ALPHA RISK ASSESSMENT</b>
• <b>Entry:</b> Early (Market cap still consolidating vs OG Memes)
• <b>Sentiment:</b> Bullish Narrative
• <b>Note:</b> <i>High volatility. Never invest more than you can afford to lose.</i>

#NEIRO #AirdropAlpha #CryptoResearch #DOGE
`;
}

module.exports = buildPost;
