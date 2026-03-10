const scanGithub = require("./sources/github");
const scanGalxe = require("./sources/galxe");
const scanZealy = require("./sources/zealy");
const scanAirdrops = require("./sources/airdrops");
const scanCryptoRank = require("./sources/cryptorank");
const scanDefiLlama = require("./sources/defillama");

const researchProject = require("./research");
const tokenCheck = require("./tokenCheck");
const scoreProject = require("./scoring");
const { sendTelegram } = require("./telegram");

const fs = require("fs");

let posted = [];

try {
    posted = JSON.parse(fs.readFileSync("data/projects.json"));
} catch {
    posted = [];
}

async function processProject(project) {

    console.log("Checking:", project.name);

    if (posted.includes(project.name)) return;

    const research = await researchProject(project);

    if (!research) return;

    const listed = await tokenCheck(project.name);

    if (listed) return;

    const score = scoreProject(research);

    if (score < 6) return;

    const message = `
💎 <b>NEW ALPHA</b>

Project: ${research.name}

Website
${research.website}

Twitter
${research.twitter || "N/A"}

Source
${research.source}
`;

    await sendTelegram(message);

    posted.push(project.name);

    fs.writeFileSync(
        "data/projects.json",
        JSON.stringify(posted, null, 2)
    );

}

async function main() {

    const sources = await Promise.all([
    scanAirdrops().catch(() => []),
    scanCryptoRank().catch(() => []),
    scanDefiLlama().catch(() => []),
    scanGithub().catch(() => [])
]);

    const projects = sources.flat();

    console.log("Projects detected:", projects.length);

    for (const p of projects.slice(0,20)) {
        await processProject(p);
    }

}

main();
