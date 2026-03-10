const scanTrackers = require("./trackers");
const scanNews = require("./news");
const scanGalxe = require("./galxe");
const scanZealy = require("./zealy");
const scanCMC = require("./cmc");
const checkFunding = require("./funding");

const researchProject = require("./research");
const { sendTelegram } = require("./telegram");

console.log("🛰️ Global Alpha Scan Started...");

async function processProject(name, link, status) {

    const research = await researchProject(name, link);

    if (!research) {

        console.log("❌ Skipping project:", name);
        return;

    }

    const message = `
<b>🚀 NEW ALPHA: ${research.name.toUpperCase()}</b>

<pre>Status: ${status}</pre>

<b>🌐 OFFICIAL WEBSITE</b>
<a href="${research.website}">${research.website}</a>

<b>📱 OFFICIAL X</b>
<a href="${research.twitter}">${research.twitter}</a>

<b>📊 DATA</b>
<a href="${research.link}">View Market Data</a>

<i>⚠️ Always DYOR</i>
`;

    await sendTelegram(message);

}

async function main() {

    // CoinGecko trackers
    scanTrackers(async (projects) => {

        if (!Array.isArray(projects)) return;

        for (const p of projects.slice(0, 3)) {

            const score = checkFunding(p.name);

            await processProject(p.name, p.link, score);

        }

    });

    // Crypto news
    scanNews(async (newsItems) => {

        if (!Array.isArray(newsItems)) return;

        for (const item of newsItems) {

            if (/airdrop|funding|testnet|mainnet/i.test(item.name)) {

                await processProject(
                    item.name,
                    item.link,
                    "Breaking News"
                );

            }

        }

    });

    // Galxe
    scanGalxe(async (campaigns) => {

        if (!Array.isArray(campaigns)) return;

        for (const c of campaigns.slice(0,3)) {

            await processProject(
                c.name,
                c.link,
                "Galxe Campaign"
            );

        }

    });

    // Zealy
    scanZealy(async (communities) => {

        if (!Array.isArray(communities)) return;

        for (const z of communities.slice(0,3)) {

            await processProject(
                z.name,
                z.link,
                "Zealy Campaign"
            );

        }

    });

    // CoinMarketCap
    scanCMC(async (coins) => {

        if (!Array.isArray(coins)) return;

        for (const coin of coins.slice(0,3)) {

            await processProject(
                coin.name,
                coin.link,
                "New Listing"
            );

        }

    });

}

main();
