const CHANNEL_RULES = {
  HUNT: {
    id: "1495049686363410535",
    allowedGames: ["hunt", "dungeon"]
  },
  CASINO: {
    id: "1495050723522641970",
    allowedGames: ["cf", "rps", "slots", "roulette", "dadu"]
  },
  TEST: {
    id: "1494682289530081413",
    allowedGames: ["all"]
  }
};

function isGameAllowedInChannel(channelId, gameName) {
  if (channelId === CHANNEL_RULES.TEST.id) return true;
  
  for (const [zoneName, zone] of Object.entries(CHANNEL_RULES)) {
    if (zone.id === channelId) {
      return zone.allowedGames.includes(gameName) || zone.allowedGames.includes("all");
    }
  }
  return false;
}

function validateHuntChannel(channelId) {
  return channelId === CHANNEL_RULES.HUNT.id || channelId === CHANNEL_RULES.TEST.id;
}

function validateCasinoChannel(channelId) {
  return channelId === CHANNEL_RULES.CASINO.id || channelId === CHANNEL_RULES.TEST.id;
}

function getChannelZone(channelId) {
  for (const [zoneName, zone] of Object.entries(CHANNEL_RULES)) {
    if (zone.id === channelId) {
      return zoneName;
    }
  }
  return null;
}

function getAllowedGames(channelId) {
  for (const [zoneName, zone] of Object.entries(CHANNEL_RULES)) {
    if (zone.id === channelId) {
      return zone.allowedGames;
    }
  }
  return [];
}

module.exports = {
  CHANNEL_RULES,
  isGameAllowedInChannel,
  validateHuntChannel,
  validateCasinoChannel,
  getChannelZone,
  getAllowedGames,
  HUNT_CHANNEL_ID: CHANNEL_RULES.HUNT.id,
  CASINO_CHANNEL_ID: CHANNEL_RULES.CASINO.id,
  TEST_CHANNEL_ID: CHANNEL_RULES.TEST.id
};