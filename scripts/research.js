const axios = require("axios");

async function researchProject(name, link) {

    try {

        const search = await axios.get(
            `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(name)}`
        );

        // if token exists -> skip
        if (search.data.coins.length > 0) {

            console.log("Token already listed:", name);
            return null;

        }

        const message = `
<b>💎 NEW EARLY ALPHA</b>

Project: ${name}

Status: Pre-Token Stage
Token: Not Listed Yet

Why this matters:
Early users often receive retroactive airdrops if a token launches later.

<b>Project Link</b>
${link}

<b>Possible Actions</b>
• Visit website  
• Follow official X  
• Join community  
• Complete early tasks  

<i>More research coming if activity increases.</i>
`;

        return message;

    } catch (err) {

        console.log("Research error:", name);
        return null;

    }

}

module.exports = researchProject;
