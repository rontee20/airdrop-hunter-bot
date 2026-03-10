const scanTrackers = require("./trackers");
const scanNews = require("./news");
const scanGalxe = require("./galxe");
const scanZealy = require("./zealy");
const scanCMC = require("./cmc");

const researchProject = require("./research");
const { sendTelegram } = require("./telegram");

console.log("🛰️ Global Alpha Scan Started...");

// prevent duplicate posts in one run
const posted = new Set();

async function processProject(name) {

    if (!name) return;

    // avoid duplicate processing
    const key = name.toLowerCase();
    if (posted.has(key)) return;

    posted.add(key);

    try {

        const message = await researchProject(name);

        // if research incomplete → skip
        if (!message) {

            console.log("Skipping (research incomplete):", name);
            return;

        }

        await sendTelegram(message);

        console.log("Posted:", name);

    } catch (err) {

        console.log("Processing failed:", name);

    }

}

async function main() {

    // 1️⃣ CoinGecko / tracker projects
    scanTrackers(async (projects) => {

        if (!Array.isArray(projects)) return;

        for (const p of projects.slice(0, 5)) {

            await processProject(p.name);

        }

    });

    // 2️⃣ Crypto news scanning
    scanNews(async (newsItems) => {

        if (!Array.isArray(newsItems)) return;

        for (const item of newsItems) {

            if (/airdrop|funding|testnet|mainnet/i.test(item.name)) {

                await processProject(item.name);

            }

        }

    });

    // 3️⃣ Galxe campaigns
    scanGalxe(async (campaigns) => {

        if (!Array.isArray(campaigns)) return;

        for (const c of campaigns.slice(0,5)) {

            await processProject(c.name);

        }

    });

    // 4️⃣ Zealy campaigns
    scanZealy(async (communities) => {

        if (!Array.isArray(communities)) return;

        for (const z of communities.slice(0,5)) {

            await processProject(z.name);

        }

    });

    // 5️⃣ CoinMarketCap new listings
    scanCMC(async (coins) => {

        if (!Array.isArray(coins)) return;

        for (const coin of coins.slice(0,5)) {

            await processProject(coin.name);

        }

    });

}

main();
