const scanTrackers = require("./trackers");
const scanNews = require("./news");
const scanGalxe = require("./galxe");
const scanZealy = require("./zealy");
const scanCMC = require("./cmc");

const researchProject = require("./research");
const { sendTelegram } = require("./telegram");

console.log("🛰️ Global Alpha Scan Started...");

async function processProject(name) {

    const research = await researchProject(name);

    if (!research) {
        console.log("Skipping project:", name);
        return;
    }

    const message = `
<b>🚀 ${research.name.toUpperCase()}</b>

<b>Official Website</b>
${research.website}

<b>Official X</b>
${research.twitter}

<b>Data</b>
${research.gecko}

<i>Always DYOR</i>
`;

    await sendTelegram(message);
}

async function main() {

    // CoinGecko trending
    scanTrackers(async (projects) => {

        if (!Array.isArray(projects)) return;

        for (const p of projects.slice(0, 3)) {
            await processProject(p.name);
        }

    });

    // Crypto news
    scanNews(async (newsItems) => {

        if (!Array.isArray(newsItems)) return;

        for (const item of newsItems) {

            if (/airdrop|funding|testnet|mainnet/i.test(item.name)) {

                await processProject(item.name);

            }

        }

    });

    // Galxe campaigns
    scanGalxe(async (campaigns) => {

        if (!Array.isArray(campaigns)) return;

        for (const c of campaigns.slice(0,3)) {

            await processProject(c.name);

        }

    });

    // Zealy campaigns
    scanZealy(async (communities) => {

        if (!Array.isArray(communities)) return;

        for (const z of communities.slice(0,3)) {

            await processProject(z.name);

        }

    });

    // CoinMarketCap new listings
    scanCMC(async (coins) => {

        if (!Array.isArray(coins)) return;

        for (const coin of coins.slice(0,3)) {

            await processProject(coin.name);

        }

    });

}

main();
