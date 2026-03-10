const scanTrackers = require("./trackers");
const scanNews = require("./news");
const scanGalxe = require("./galxe");
const scanZealy = require("./zealy");
const scanCMC = require("./cmc");
const checkFunding = require("./funding");
const buildPost = require("./research");
const { sendTelegram } = require("./telegram");

console.log("🛰️ Global Alpha Scan Started...");

async function main() {

    // Test message
    await sendTelegram(buildPost(
        "Pudgy Penguins",
        "https://www.coingecko.com/en/coins/pudgy-penguins",
        "Standard Project"
    ));

    // Trackers
    scanTrackers(async (projects) => {

        if (!Array.isArray(projects)) return;

        for (const p of projects.slice(0,3)) {

            const score = checkFunding(p.name);

            const post = buildPost(
                p.name,
                p.link,
                score
            );

            await sendTelegram(post);

        }

    });

    // News
    scanNews(async (newsItems) => {

        if (!Array.isArray(newsItems)) return;

        for (const item of newsItems) {

            if (/airdrop|funding|testnet|mainnet/i.test(item.name)) {

                const post = buildPost(
                    item.name,
                    item.link,
                    "Breaking News"
                );

                await sendTelegram(post);

            }

        }

    });

    // Galxe
    scanGalxe(async (campaigns) => {

        if (!Array.isArray(campaigns)) return;

        for (const c of campaigns.slice(0,3)) {

            const post = buildPost(
                c.name,
                c.link,
                "Galxe Campaign"
            );

            await sendTelegram(post);

        }

    });

    // Zealy
    scanZealy(async (communities) => {

        if (!Array.isArray(communities)) return;

        for (const z of communities.slice(0,3)) {

            const post = buildPost(
                z.name,
                z.link,
                "Zealy Campaign"
            );

            await sendTelegram(post);

        }

    });

    // CoinMarketCap listings
    scanCMC(async (coins) => {

        if (!Array.isArray(coins)) return;

        for (const coin of coins.slice(0,3)) {

            const post = buildPost(
                coin.name,
                coin.link,
                "New Listing"
            );

            await sendTelegram(post);

        }

    });

}

main();
