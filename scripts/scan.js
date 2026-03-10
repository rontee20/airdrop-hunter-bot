const scanGalxe = require("./galxe");
const scanZealy = require("./zealy");
const buildPost = require("./research");

scanGalxe(data => {

  data.data.campaigns.slice(0,2).forEach(c => {

    const post = buildPost(c.name, "https://galxe.com");

    sendTelegram(post);

  });

});
