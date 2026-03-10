const axios = require("axios");

async function researchProject(name, link) {

    try {

        // Check if token exists on CoinGecko
        const search = await axios.get(
            `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(name)}`
        );

        // If token already listed → skip
        if (search.data.coins.length > 0) {

            console.log("Token already listed:", name);
            return null;

        }

        // Simple alpha message
        const message = `
💎 NEW EARLY ALPHA

Project: ${name}

Status: Pre-Token Stage
Token: Not Listed Yet

Why it matters:
Early users often qualify for retroactive rewards when tokens launch.

Project Link:
${link}

Possible actions:
• Visit the project site
• Follow official X
• Join community
• Complete early quests if available

More research coming if ecosystem activity increases.
`;

        return message;

    } catch (err) {

        console.log("Research error:", name);
        return null;

    }

}

module.exports = researchProject;
