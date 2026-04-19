const { User } = require("../models/User");

// Lock system untuk race condition
const processingLocks = new Map();

async function acquireLock(userId, action, timeout = 5000) {
  const key = `${userId}:${action}`;
  if (processingLocks.has(key)) {
    return false;
  }
  processingLocks.set(key, Date.now());
  setTimeout(() => {
    if (processingLocks.get(key)) {
      processingLocks.delete(key);
    }
  }, timeout);
  return key;
}

function releaseLock(key) {
  if (key && processingLocks.has(key)) {
    processingLocks.delete(key);
  }
}

async function getUser(userId) {
  let user = await User.findOne({ userId });
  if (!user) {
    user = await User.create({ userId, credits: 0, points: 0 });
  }
  return user;
}

async function addCredits(userId, amount, source = "minigame") {
  const lockKey = await acquireLock(userId, "economy_add", 5000);
  if (!lockKey) throw new Error("Transaction in progress");
  
  try {
    const user = await getUser(userId);
    await User.updateOne(
      { userId },
      { $inc: { credits: amount } }
    );
    return true;
  } finally {
    releaseLock(lockKey);
  }
}

async function removeCredits(userId, amount, source = "minigame") {
  const lockKey = await acquireLock(userId, "economy_remove", 5000);
  if (!lockKey) throw new Error("Transaction in progress");
  
  try {
    const user = await getUser(userId);
    if (user.credits < amount) {
      throw new Error("Insufficient credits");
    }
    
    const result = await User.updateOne(
      { userId, credits: { $gte: amount } },
      { $inc: { credits: -amount } }
    );
    
    if (result.modifiedCount === 0) {
      throw new Error("Transaction failed");
    }
    
    return true;
  } finally {
    releaseLock(lockKey);
  }
}

async function getBalance(userId) {
  const user = await getUser(userId);
  return user.credits;
}

async function transferCredits(fromUserId, toUserId, amount) {
  if (amount <= 0) throw new Error("Invalid amount");
  
  const fromLock = await acquireLock(fromUserId, "transfer", 5000);
  const toLock = await acquireLock(toUserId, "transfer", 5000);
  
  if (!fromLock || !toLock) {
    if (fromLock) releaseLock(fromLock);
    if (toLock) releaseLock(toLock);
    throw new Error("Transaction in progress");
  }
  
  try {
    const fromUser = await getUser(fromUserId);
    if (fromUser.credits < amount) {
      throw new Error("Insufficient credits");
    }
    
    await User.updateOne(
      { userId: fromUserId, credits: { $gte: amount } },
      { $inc: { credits: -amount } }
    );
    
    await User.updateOne(
      { userId: toUserId },
      { $inc: { credits: amount } }
    );
    
    return true;
  } finally {
    releaseLock(fromLock);
    releaseLock(toLock);
  }
}

module.exports = {
  addCredits,
  removeCredits,
  getBalance,
  transferCredits,
  getUser,
  acquireLock,
  releaseLock
};