const scanTrackers = require("./trackers");
const scanNews = require("./news");
const scanGalxe = require("./galxe");
const scanZealy = require("./zealy");
const checkFunding = require("./funding");
const buildPost = require("./research");
const sendTelegram = require("./telegram"); // Removed curly braces based on your module.exports

async function runMasterScanner() {
    console.log("🛰️ Global Alpha Scan Started...");

    try {
        // We use Promises to make sure the script doesn't end early
        const tasks = [];

        // 1️⃣ Scan Trackers
        tasks.push(new Promise((resolve) => {
            scanTrackers(async (projects) => {
                for (const p of projects.slice(0, 5)) {
                    try {
                        const score = await checkFunding(p.name);
                        const post = buildPost(p.name, p.link, score);
                        await sendTelegram(post);
                        console.log("📊 Tracker Alpha:", p.name);
                    } catch (err) { console.log("Tracker error:", err.message); }
                }
                resolve();
            });
        }));

        // 2️⃣ Scan Crypto News
        tasks.push(new Promise((resolve) => {
            scanNews(async (newsItems) => {
                for (const item of newsItems) {
                    try {
                        if (/airdrop|funding|testnet|mainnet/i.test(item.name)) {
                            const post = buildPost(item.name, item.link, "🔥 Breaking News");
                            await sendTelegram(post);
                            console.log("📰 News Alpha:", item.name);
                        }
                    } catch (err) { console.log("News error:", err.message); }
                }
                resolve();
            });
        }));

        // 3️⃣ Scan Galxe Campaigns
        tasks.push(new Promise((resolve) => {
            scanGalxe(async (campaigns) => {
                for (const c of campaigns.slice(0, 5)) {
                    try {
                        const post = buildPost(c.name, c.link, "🎯 Galxe Campaign");
                        await sendTelegram(post);
                        console.log("🎯 Galxe Alpha:", c.name);
                    } catch (err) { console.log("Galxe error:", err.message); }
                }
                resolve();
            });
        }));

        // 4️⃣ Scan Zealy Communities
        tasks.push(new Promise((resolve) => {
            scanZealy(async (communities) => {
                for (const z of communities.slice(0, 5)) {
                    try {
                        const post = buildPost(z.name, z.link, "🏆 Zealy Campaign");
                        await sendTelegram(post);
                        console.log("🏆 Zealy Alpha:", z.name);
                    } catch (err) { console.log("Zealy error:", err.message); }
                }
                resolve();
            });
        }));

        // Wait for all scanners to finish before closing
        await Promise.all(tasks);
        console.log("🏁 All scans finished and sent!");

    } catch (error) {
        console.error("❌ Scanner failed:", error);
    }
}

runMasterScanner();
