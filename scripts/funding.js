function checkFunding(projectName) {
    const tier1 = ["a16z", "Paradigm", "Polychain", "Binance Labs", "Coinbase Ventures"];
    const tier2 = ["Animoca Brands", "Multicoin", "OKX Ventures", "HashKey"];

    let score = "Standard Project";
    
    tier1.forEach(vc => {
        if (projectName.includes(vc)) score = "⭐⭐⭐ TIER 1 ALPHA";
    });

    tier2.forEach(vc => {
        if (projectName.includes(vc) && score === "Standard Project") {
            score = "⭐ TIER 2 ALPHA";
        }
    });

    return score;
}

module.exports = checkFunding;
