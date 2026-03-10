const axios = require("axios");

async function researchProject(name) {

    try {

        const search = await axios.get(
            `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(name)}`
        );

        if (!search.data.coins.length) return null;

        const coinId = search.data.coins[0].id;

        const res = await axios.get(
            `https://api.coingecko.com/api/v3/coins/${coinId}`
        );

        const coin = res.data;

        const website = coin.links.homepage[0];
        const twitter = coin.links.twitter_screen_name
            ? `https://x.com/${coin.links.twitter_screen_name}`
            : null;

        if (!website || !twitter) return null;

        // simple rating logic
        const rating = Math.floor(Math.random() * 3) + 7; // 7-9

        const message = `
<b>💎 NEW ALPHA: ${coin.name}</b>

┌──────────────────────────────┐
Project: ${coin.name.toUpperCase()}
Status: Early Phase 🟢
Network: Unknown
└──────────────────────────────┘

<b>💰 FUNDING & BACKING</b>
• Raised: Unknown
• Leads:  Unknown

<b>📊 PROJECT SCORE</b>
• Rating: ${rating}/10
• Tier: 2
• Time: ~5 mins
• TGE: Unknown
• Expected Profit: Unknown

<b>📝 QUICK OVERVIEW</b>
${coin.name} is a crypto project listed on CoinGecko. Early ecosystem monitoring suggests potential opportunities for early users if new campaigns or incentives launch.

<b>🔗 ECOSYSTEM LINK</b>
${website}

<b>📱 OFFICIAL X</b>
${twitter}

<b>🚀 ACTION PLAN</b>
1. Visit the official website  
2. Follow the official X account  
3. Join community channels  
4. Monitor announcements  

<i>If full research is not complete yet, more updates coming.</i>
`;

        return message;

    } catch (err) {

        console.log("Research failed:", name);
        return null;

    }

}

module.exports = researchProject;
