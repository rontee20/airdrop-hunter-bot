function checkFunding(name){

  const vcList=[
    "a16z",
    "Paradigm",
    "Coinbase Ventures",
    "Binance Labs"
  ];

  return vcList[Math.floor(Math.random()*vcList.length)];

}

module.exports = checkFunding;
