const scanTrackers = require("./trackers");
const scanNews = require("./news");
const scanGalxe = require("./galxe");
const scanZealy = require("./zealy");
const checkFunding = require("./funding");
const buildPost = require("./research");
const sendTelegram = require("./telegram");

async function runMasterScanner() {
    console.log("🛰️ Global Alpha Scan Started...");

    // 1. Scan Trackers (CoinGecko Trending)
    scanTrackers((projects) => {
        projects.slice(0, 2).forEach(p => {
            const score = checkFunding(p.name);
            sendTelegram(buildPost(p.name, p.link, score));
        });
    });

    // 2. Scan News (CryptoCompare/RSS)
    scanNews((newsItems) => {
        newsItems.forEach(item => {
            // Only post if it contains alpha keywords
            if (/airdrop|funding|testnet|mainnet/i.test(item.name)) {
                sendTelegram(buildPost(item.name, item.link, "Breaking News"));
            }
        });
    });

    // 3. Scan Galxe/Zealy (Quest Data)
    // Add similar logic for scanGalxe and scanZealy here
}

runMasterScanner();
