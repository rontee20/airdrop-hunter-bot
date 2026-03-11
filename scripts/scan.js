// ─── TRUSTED SOURCES ONLY ─────────────────────────────────────────────────────
// Add only channels you personally trust and verify.
// Use the full t.me/s/ URL format for public channel scraping.
// These channels are curated manually — bot will ONLY scan these.

export const telegramChannels = [
  // "https://t.me/s/yourchannel1",
  // "https://t.me/s/yourchannel2",
];

// ─── BLACKLISTED DOMAINS ──────────────────────────────────────────────────────
// Posts containing these domains will be auto-blocked (referral farms, scam sites)
export const blacklistedDomains = [
  "gate.com/share",
  "gate.com/referral",
  "gate.io/signup",
  "binance.com/referral",
  "bybit.com/invite",
  "kucoin.com/ucenter/signup",
  "mexc.com/register",
  "bitget.com/referral",
  "okx.com/join",
  "t.me/+",           // private group invites
  "bit.ly",           // masked/shortened links
  "tinyurl.com",
  "rb.gy",
  "cutt.ly",
];

// ─── BLACKLISTED WALLET/PATTERN KEYWORDS ─────────────────────────────────────
export const blacklistedKeywords = [
  "refer code",
  "referral code",
  "reffer code",
  "affiliate link",
  "invite code",
  "signup bonus",
  "register and earn",
  "complete $1k",
  "complete $500",
  "spot trade",
  "fcfs",              // "first come first served" — often fake
  "limited slots",
  "only 800 users",
  "only 1000 users",
  "dm for whitelist",
  "dm me",
  "send eth",
  "send bnb",
  "seed phrase",
  "private key",
  "recovery phrase",
  "pay gas fee",
  "pay fee to claim",
  "double your",
  "guaranteed profit",
  "risk free",
  "elon giveaway",
  "vitalik giveaway",
];
