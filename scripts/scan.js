const https = require("https");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Helper function to handle requests cleanly
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Status ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function sendTelegram(text) {
  const data = JSON.stringify({ chat_id: CHAT_ID, text: text });
  const options = {
    hostname: "api.telegram.org",
    path: `/bot${BOT_TOKEN}/sendMessage`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
    },
  };
  return makeRequest(options, data);
}

async function scanGithub() {
  try {
    await sendTelegram("🚀 GitHub scan started");

    const githubOptions = {
      hostname: "api.github.com",
      path: "/search/repositories?q=blockchain&sort=updated",
      headers: { "User-Agent": "NodeJS-Repo-Scanner-Bot" }, // Be descriptive here
    };

    const data = await makeRequest(githubOptions);

    if (!data.items || data.items.length === 0) {
      await sendTelegram("No repositories found");
      return;
    }

    const repos = data.items.slice(0, 3);
    for (const repo of repos) {
      const message = `🚨 Crypto Project\nName: ${repo.name}\nRepo: ${repo.html_url}`;
      await sendTelegram(message);
    }
  } catch (error) {
    console.error("Scan failed:", error.message);
    await sendTelegram(`❌ Error: ${error.message}`);
  }
}

scanGithub();
