function scoreProject(p) {

    let score = 0;

    if (p.website) score += 2;
    if (p.twitter) score += 2;
    if (p.discord) score += 1;
    if (p.github) score += 2;
    if (p.docs) score += 1;

    if (p.source === "Galxe") score += 3;
    if (p.source === "Zealy") score += 3;
    if (p.source === "CryptoRank") score += 2;
    if (p.source === "airdrops.io") score += 2;
    if (p.source === "GitHub") score += 1;

    return score;

}

module.exports = scoreProject;
