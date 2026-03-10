const scanAirdrops = require("./airdrops");
const researchProject = require("./research");
const { sendTelegram } = require("./telegram");

console.log("Alpha scanner started");

const posted = new Set();

async function processProject(name, link) {

    if (!name) return;

    const key = name.toLowerCase();

    if (posted.has(key)) return;

    posted.add(key);

    console.log("Checking:", name);

    const message = await researchProject(name, link);

    if (!message) {

        console.log("Skipped:", name);
        return;

    }

    console.log("Posting:", name);

    await sendTelegram(message);

}

async function main() {

    scanAirdrops(async (projects) => {

        if (!Array.isArray(projects)) return;

        for (const p of projects.slice(0,5)) {

            await processProject(p.name, p.link);

        }

    });

}

main();
