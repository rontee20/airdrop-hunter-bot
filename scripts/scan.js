const scanAirdrops = require("./airdrops");
const scanTrackers = require("./trackers");
const scanNews = require("./news");
const scanGalxe = require("./galxe");
const scanZealy = require("./zealy");
const scanCMC = require("./cmc");

const researchProject = require("./research");
const { sendTelegram } = require("./telegram");

console.log("🛰️ Alpha Intelligence Scanner Started...");

const posted = new Set();

async function processProject(name) {

    if (!name) return;

    const key = name.toLowerCase();
    if (posted.has(key)) return;

    posted.add(key);

    try {

        const message = await researchProject(name);

        if (!message) {

            console.log("Skipping:", name);
            return;

        }

        await sendTelegram(message);

        console.log("Posted:", name);

    } catch (err) {

        console.log("Processing failed:", name);

    }

}

async function main() {

    // tracker scan
    scanTrackers(async (projects) => {

        if (!Array.isArray(projects)) return;

        for (const p of projects.slice(0,5)) {

            await processProject(p.name);

        }

    });

    // news scan
    scanNews(async (newsItems) => {

        if (!Array.isArray(newsItems)) return;

        for (const item of newsItems) {

            if (/airdrop|funding|testnet|mainnet/i.test(item.name)) {

                await processProject(item.name);

            }

        }

    });

    // galxe scan
    scanGalxe(async (campaigns) => {

        if (!Array.isArray(campaigns)) return;

        for (const c of campaigns.slice(0,5)) {

            await processProject(c.name);

        }

    });

    // zealy scan
    scanZealy(async (communities) => {

        if (!Array.isArray(communities)) return;

        for (const z of communities.slice(0,5)) {

            await processProject(z.name);

        }

    });

    // cmc scan
    scanCMC(async (coins) => {

        if (!Array.isArray(coins)) return;

        for (const coin of coins.slice(0,5)) {

            await processProject(coin.name);

        }

    });

}

main();
