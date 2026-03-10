const scanAirdrops = require("./sources/airdrops");
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

    console.log("Checking project:", project.name);

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

    // check token listing
    const listed = await tokenCheck(project.name);

    if (listed) {

        console.log("Token already listed:", project.name);
        return;

    }

    // scoring filter
    const score = scoreProject(research);

    if (score < 6) {

        console.log("Low score project:", project.name);
        return;

    }

    const message = `
💎 <b>NEW ALPHA PROJECT</b>

Project: ${research.name}

Website:
${research.website}

Twitter:
${research.twitter || "Not found"}

Discord:
${research.discord || "Not found"}

Github:
${research.github || "Not found"}

Source:
${research.source}
`;

    await sendTelegram(message);

    // save project
    posted.push(project.name);

    fs.writeFileSync(
        "data/projects.json",
        JSON.stringify(posted, null, 2)
    );

}

async function main() {

    const projects = await scanAirdrops();

    for (const p of projects.slice(0, 10)) {

        await processProject(p);

    }

}

main();
