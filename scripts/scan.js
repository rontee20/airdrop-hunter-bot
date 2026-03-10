const buildPost = require("./research");

const post = buildPost(projectName, projectLink);

sendTelegram(post);
