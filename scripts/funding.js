function checkFunding(project) {

  const investors = [
    "a16z",
    "Paradigm",
    "Coinbase Ventures",
    "Binance Labs"
  ];

  let score = 0;

  investors.forEach(inv => {

    if (project.includes(inv)) {
      score += 2;
    }

  });

  return score;

}

module.exports = checkFunding;
