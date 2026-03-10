const scanTrackers = require("./trackers");
const scanNews = require("./news");
const scanGalxe = require("./galxe");
const scanZealy = require("./zealy");
const checkFunding = require("./funding");
const buildPost = require("./research");
const { sendTelegram } = require("./telegram");

async function runMasterScanner() {

    console.log("🛰️ Global Alpha Scan Started...");

    // TEST MESSAGE
    await sendTelegram("🚀 Airdrop Hunter Bot Started");

    // 1️⃣ Trackers
    scanTrackers(async (projects) => {

        if (!Array.isArray(projects)) return;

        for (const p of projects.slice(0,3)) {

            const score = checkFunding(p.name);

            const post = buildPost(p.name, p.link, score);

            await sendTelegram(post);

        }

    });

    // 2️⃣ News
    scanNews(async (newsItems) => {

        if (!Array.isArray(newsItems)) return;

        for (const item of newsItems) {

            if (/airdrop|funding|testnet|mainnet/i.test(item.name)) {

                const post = buildPost(
                    item.name,
                    item.link,
                    "🔥 Breaking News"
                );

                await sendTelegram(post);

            }

        }

    });

    // 3️⃣ Galxe
    scanGalxe(async (campaigns) => {

        if (!Array.isArray(campaigns)) return;

        for (const c of campaigns.slice(0,3)) {

            const post = buildPost(
                c.name,
                c.link,
                "🎯 Galxe Campaign"
            );

            await sendTelegram(post);

        }

    });

    // 4️⃣ Zealy
    scanZealy(async (communities) => {

        if (!Array.isArray(communities)) return;

        for (const z of communities.slice(0,3)) {

            const post = buildPost(
                z.name,
                z.link,
                "🏆 Zealy Campaign"
            );

            await sendTelegram(post);

        }

    });

}

runMasterScanner();
