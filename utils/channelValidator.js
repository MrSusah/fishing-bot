const CHANNEL_RULES = {
  HUTAN: {
    id: "1495049686363410535",
    allowedGames: ["hunt", "dungeon"]
  },
  KASINO: {
    id: "1495050723522641970",
    allowedGames: ["cf", "rps", "slots", "roulette", "dadu", "bomb"]
  }
};

function isGameAllowedInChannel(channelId, gameName) {
  for (const [zoneName, zone] of Object.entries(CHANNEL_RULES)) {
    if (zone.id === channelId) {
      return zone.allowedGames.includes(gameName);
    }
  }
  return false;
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
  getChannelZone,
  getAllowedGames
};