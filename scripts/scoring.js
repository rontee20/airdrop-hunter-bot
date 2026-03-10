function scoreProject(project) {

    let score = 0;

    if (project.website) score += 2;
    if (project.twitter) score += 2;
    if (project.discord) score += 1;
    if (project.github) score += 2;
    if (project.docs) score += 1;

    if (project.source === "Galxe") score += 2;
    if (project.source === "Zealy") score += 2;
    if (project.source === "CryptoRank") score += 1;

    return score;

}

module.exports = scoreProject;
