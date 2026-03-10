const scanTrackers = require("./trackers");
const scanNews = require("./news");
const checkFunding = require("./funding");
const buildPost = require("./research");
const sendTelegram = require("./telegram");

scanTrackers(projects => {

  projects.slice(0,2).forEach(project=>{

    const funding = checkFunding(project.name);

    const post = buildPost(
      project.name,
      project.link,
      funding
    );

    sendTelegram(post);

  });

});

scanNews(projects=>{

  projects.slice(0,1).forEach(project=>{

    const funding = checkFunding(project.name);

    const post = buildPost(
      project.name,
      project.link,
      funding
    );

    sendTelegram(post);

  });

});
