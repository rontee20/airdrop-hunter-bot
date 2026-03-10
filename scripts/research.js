function buildResearchPost(name, link) {

  const post = `
💎 NEW ALPHA: ${name}

┌──────────────────────────────┐
  Project: ${name.toUpperCase()}
  Status:  Early Phase 🟢
  Network: Mainnet / Testnet
└──────────────────────────────┘

💰 FUNDING & BACKING
• Raised: Unknown
• Leads: Research Pending

📝 QUICK OVERVIEW
${name} is building a decentralized infrastructure layer. Early ecosystem activity suggests potential retroactive rewards for early users.

🔗 ECOSYSTEM LINK
${link}

🚀 ACTION PLAN
1️⃣ Follow project on X
2️⃣ Join Discord community
3️⃣ Interact with early features or testnet

⚠️ Risk Level: Medium
#Airdrop #Crypto #Alpha
`;

  return post;
}

module.exports = buildResearchPost;
