const axios = require("axios");

async function researchProject(name) {

    try {

        // search project
        const search = await axios.get(
            `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(name)}`
        );

        if (!search.data.coins.length) return null;

        const coinId = search.data.coins[0].id;

        // get full project data
        const res = await axios.get(
            `https://api.coingecko.com/api/v3/coins/${coinId}`
        );

        const coin = res.data;

        const website = coin.links.homepage[0];
        const twitter = coin.links.twitter_screen_name
            ? `https://x.com/${coin.links.twitter_screen_name}`
            : null;

        if (!website || !twitter) return null;

        const marketCap = coin.market_data.market_cap.usd || 0;
        const rank = coin.market_cap_rank || 9999;

        // ---------- rating logic ----------
        let rating = 5;

        if (rank < 100) rating = 9;
        else if (rank < 300) rating = 8;
        else if (rank < 600) rating = 7;
        else rating = 6;

        // ---------- tier logic ----------
        let tier = 3;

        if (rank < 100) tier = 1;
        else if (rank < 300) tier = 2;

        const message = `
<b>💎 NEW ALPHA: ${coin.name.toUpperCase()}</b>

┌──────────────────────────────┐
Project: ${coin.name}
Status: Active 🟢
Network: Crypto Ecosystem
└──────────────────────────────┘

<b>📊 PROJECT SCORE</b>
• Rating: ${rating}/10
• Tier: ${tier}
• Market Rank: #${rank}
• Time: ~5 minutes research

<b>📝 QUICK OVERVIEW</b>
${coin.description.en.slice(0,200)}...

<b>🌐 WEBSITE</b>
${website}

<b>📱 OFFICIAL X</b>
${twitter}

<b>📊 MARKET DATA</b>
https://www.coingecko.com/en/coins/${coinId}

<b>🚀 ACTION PLAN</b>
1️⃣ Visit the website  
2️⃣ Follow official X  
3️⃣ Monitor ecosystem updates  

<i>More research updates coming if new opportunities appear.</i>
`;

        return message;

    } catch (err) {

        console.log("Research failed:", name);
        return null;

    }

}

module.exports = researchProject;
