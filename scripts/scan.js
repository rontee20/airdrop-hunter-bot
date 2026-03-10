const scanAirdrops = require("./airdrops");
const researchProject = require("./research");
const { sendTelegram } = require("./telegram");

console.log("Alpha scanner started");

async function processProject(name, link) {

    console.log("Checking project:", name);

    const message = await researchProject(name, link);

    if (!message) {

        console.log("Project skipped:", name);
        return;

    }

    console.log("Posting project:", name);

    await sendTelegram(message);

}

async function main() {

    scanAirdrops(async (projects) => {

        if (!Array.isArray(projects)) {

            console.log("No projects found");
            return;

        }

        console.log("Projects found:", projects.length);

        for (const p of projects.slice(0,5)) {

            await processProject(p.name, p.link);

        }

    });

}

main();
