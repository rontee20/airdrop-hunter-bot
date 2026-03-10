const tokenCheck = require("./tokenCheck");
const scoreProject = require("./scoring");
const fs = require("fs");
const scanAirdrops = require("./sources/airdrops");
const scanCryptoRank = require("./sources/cryptorank");
const scanGalxe = require("./sources/galxe");
const scanZealy = require("./sources/zealy");
const scanDefiLlama = require("./sources/defillama");
const scanGithub = require("./sources/github");

const researchProject = require("./research");
const tokenCheck = require("./tokenCheck");
const scoreProject = require("./scoring");
const { sendTelegram } = require("./telegram");

const posted = new Map();

async function processProject(project) {

    console.log("Checking:", project.name);

    const research = await researchProject(project);

    if (!research) return;

    const listed = await tokenCheck(project.name);

    if (listed) {

        console.log("Token already listed:", project.name);
        return;

    }

    const score = scoreProject(research);

    if (score < 6) {

        console.log("Low quality project:", project.name);
        return;

    }

    const message = `
💎 <b>NEW ALPHA PROJECT</b>

Project: ${project.name}

Rating: ${score}/10

Website:
${research.website}

Twitter:
${research.twitter}

Source:
${project.source}

Tasks:
• Visit website
• Follow Twitter
• Join community

<i>More updates coming if new tasks appear</i>
`;

    await sendTelegram(message);

    posted.set(project.name, research);

}

async function main() {

    const sources = await Promise.all([

        scanAirdrops(),
        scanCryptoRank(),
        scanGalxe(),
        scanZealy(),
        scanDefiLlama(),
        scanGithub()

    ]);

    const projects = sources.flat();

    for (const p of projects) {

        await processProject(p);

    }

}

main();
