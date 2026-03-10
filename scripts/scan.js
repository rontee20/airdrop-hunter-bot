const scanAirdrops = require("./sources/airdrops");
const scanCryptoRank = require("./sources/cryptorank");
const scanDefiLlama = require("./sources/defillama");
const scanGithub = require("./sources/github");

const researchProject = require("./research");
const tokenCheck = require("./tokenCheck");
const scoreProject = require("./scoring");
const { sendTelegram } = require("./telegram");

const blacklist = require("../data/blacklist.json");

const fs = require("fs");

console.log("Alpha scanner started");

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

    // skip duplicates
    if (posted.includes(project.name)) {

        console.log("Already posted:", project.name);
        return;

    }

    // research project
    const research = await researchProject(project);

    if (!research) {

        console.log("Research failed:", project.name);
        return;

    }

    // token listing check
    const listed = await tokenCheck(project.name);

    if (listed) {

        console.log("Token already listed:", project.name);
        return;

    }

    // scoring system
    const score = scoreProject(research);

    if (score < 6) {

        console.log("Low score:", project.name);
        return;

    }

    const previous = updates[project.name];

    if (previous && previous.link === project.link) {

        console.log("No update:", project.name);
        return;

    }

    let message = "";

    if (previous) {

        message = `
⚡ <b>UPDATE</b>

Project: ${project.name}

New tasks or campaign detected.

Link:
${project.link}
`;

    } else {

        message = `
💎 <b>NEW ALPHA</b>

Project: ${project.name}

Website:
${research.website || "N/A"}

Twitter:
${research.twitter || "N/A"}

Discord:
${research.discord || "N/A"}

Github:
${research.github || "N/A"}

Source:
${project.source}
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
        scanGithub().catch(() => [])
    ]);

    const projects = sources.flat();

    console.log("Projects detected:", projects.length);

    for (const p of projects.slice(0, 30)) {

        await processProject(p);

    }

}

main();
