const scanAirdrops = require("./sources/airdrops");
const scanCryptoRank = require("./sources/cryptorank");
const scanDefiLlama = require("./sources/defillama");
const scanGalxe = require("./sources/galxe");
const scanZealy = require("./sources/zealy");
const scanTwitter = require("./sources/twitter");

const researchProject = require("./research");
const tokenCheck = require("./tokenCheck");
const scoreProject = require("./scoring");
const { sendTelegram } = require("./telegram");

const blacklist = require("../data/blacklist.json");

const fs = require("fs");

console.log("🛰️ Alpha scanner started");

let posted = [];
let updates = {};

try {
    posted = JSON.parse(fs.readFileSync("data/projects.json"));
} catch {
    posted = [];
}

try {
    updates = JSON.parse(fs.readFileSync("data/projectUpdates.json"));
} catch {
    updates = {};
}

async function processProject(project) {

    if (!project || !project.name) return;

    console.log("Checking:", project.name);

    // blacklist filter
    if (blacklist.includes(project.name)) {

        console.log("Blacklisted:", project.name);
        return;

    }

    // duplicate filter (strong)
const key = project.name.toLowerCase();

if (posted.includes(key)) {

    console.log("Duplicate project skipped:", project.name);
    return;

}

    const research = await researchProject(project);

    if (!research) return;

    // token listing check
    const listed = await tokenCheck(project.name);

    if (listed) {

        console.log("Token listed:", project.name);
        return;

    }

    // scoring filter
    const score = scoreProject(research);

    if (score < 6) {

        console.log("Low score:", project.name);
        return;

    }

    const previous = updates[project.name];

    let message = "";

    if (previous) {

        message = `
⚡ <b>UPDATE DETECTED</b>

💎 <b>${research.name}</b>

New campaign or tasks detected.

🌐 Website
${research.website || "N/A"}

🐦 X (Twitter)
${research.twitter || "N/A"}

🚀 <b>Action Plan</b>
${research.tasks.map(t => "• " + t).join("\n")}

<i>Stay active for possible retroactive rewards.</i>
`;

    } else {

        message = `
💎 <b>NEW AIRDROP ALPHA</b>

┌────────────────────────
<b>${research.name}</b>
└────────────────────────

🌐 <b>Website</b>
${research.website || "N/A"}

🐦 <b>X (Twitter)</b>
${research.twitter || "N/A"}

📡 <b>Source</b>
${project.source}

⭐ <b>Airdrop Score</b>
${score}/10

🚀 <b>Action Plan</b>
${research.tasks.map(t => "• " + t).join("\n")}

⚠️ <i>Token not listed yet — early participation recommended.</i>
`;

    }

    await sendTelegram(message);

    posted.push(project.name);

    updates[project.name] = project;

    fs.writeFileSync(
        "data/projects.json",
        JSON.stringify(posted, null, 2)
    );

    fs.writeFileSync(
        "data/projectUpdates.json",
        JSON.stringify(updates, null, 2)
    );

}

async function main() {

    const sources = await Promise.all([
        scanAirdrops().catch(() => []),
        scanCryptoRank().catch(() => []),
        scanDefiLlama().catch(() => []),
        scanGalxe().catch(() => []),
        scanZealy().catch(() => []),
        scanTwitter().catch(() => [])
    ]);

    const projects = sources.flat();

    console.log("Projects detected:", projects.length);

    for (const p of projects.slice(0, 30)) {

        await processProject(p);

    }

}

main();
