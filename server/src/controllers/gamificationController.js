import GamificationProfile from "../models/GamificationProfile.js";
import DailyHealthLog from "../models/DailyHealthLog.js";
import Activity from "../models/Activity.js";
import {
  ensureWearableLogs,
  hasWatchDataAccess,
  toComputedHealthLog
} from "../services/wearableDataService.js";
import {
  GAMIFICATION_BADGES,
  buildDailyGoals,
  buildTodaySummary,
  calculateDailyPoints,
  calculateProgressPercent,
  computeLevel,
  getLocalDateKey,
  getYesterdayDateKey,
  hasRollingStepsGoal,
  hasSleepChampion,
  isActiveDay,
  mapBadgeIdsToObjects,
  sanitizeBadgeIds
} from "../services/gamification.js";

const LOOKBACK_DAYS = 60;

function orderBadgeIds(badgeSet) {
  const ids = badgeSet instanceof Set ? badgeSet : new Set(badgeSet || []);
  return GAMIFICATION_BADGES
    .map((badge) => badge.id)
    .filter((badgeId) => ids.has(badgeId));
}

function serializeProfile(profile, goals = []) {
  const data = profile?.toObject ? profile.toObject() : profile;
  const badgeIds = sanitizeBadgeIds(data?.badges);

  return {
    ...data,
    streakDays: Number(data?.streakDays || 0),
    bestStreak: Number(data?.bestStreak || 0),
    shareCount: Number(data?.shareCount || 0),
    badgeIds,
    badges: mapBadgeIdsToObjects(badgeIds),
    levelProgress: calculateProgressPercent(data?.points || 0),
    dailyGoals: Array.isArray(goals) ? goals : []
  };
}

function buildNoWatchDataProfile() {
  const dailyGoals = buildDailyGoals(null);

  return {
    points: 0,
    dailyPoints: 0,
    level: 1,
    streakDays: 0,
    bestStreak: 0,
    shareCount: 0,
    badgeIds: [],
    badges: [],
    levelProgress: 0,
    dailyGoals,
    lastSyncedMetrics: buildTodaySummary(null, dailyGoals),
    watchDataEnabled: false
  };
}

async function getOrCreateProfile(userId) {
  let profile = await GamificationProfile.findOne({ userId });

  if (!profile) {
    profile = await GamificationProfile.create({
      userId,
      lastUpdatedDate: null
    });
  }

  profile.badges = sanitizeBadgeIds(profile.badges);
  return profile;
}

async function getRecentComputedLogs(userId) {
  await ensureWearableLogs({ userId, days: LOOKBACK_DAYS });

  const rawLogs = await DailyHealthLog.find({ userId })
    .sort({ date: -1 })
    .limit(LOOKBACK_DAYS)
    .lean();

  return rawLogs.reverse().map((log) => toComputedHealthLog(log));
}

async function computeBadgeIds({ profile, logs, userId }) {
  const unlocked = new Set(sanitizeBadgeIds(profile.badges));

  if (logs.some((log) => (log.steps || 0) >= 1000)) unlocked.add("first_steps");
  if (logs.some((log) => (log.steps || 0) >= 10000)) unlocked.add("step_master");
  if (hasRollingStepsGoal(logs, 50000, 7)) unlocked.add("marathon_walker");
  if (hasSleepChampion(logs)) unlocked.add("sleep_champion");
  if (logs.some((log) => (log.caloriesBurned || 0) >= 500)) unlocked.add("calorie_crusher");
  if (logs.length >= 30) unlocked.add("consistency_king");

  const hydrationDays = logs.filter(
    (log) => Number(log?.nutrition?.waterIntake || 0) >= 2.5
  ).length;
  if (hydrationDays >= 5) unlocked.add("hydration_hero");

  const last7 = logs.slice(-7);
  if (last7.length === 7) {
    const heartRates = last7
      .map((log) => Number(log.heartRateAvg || 0))
      .filter((value) => value > 0);

    if (heartRates.length === 7) {
      const avgHeartRate =
        heartRates.reduce((sum, value) => sum + value, 0) / heartRates.length;
      const stableHeartRate = heartRates.every(
        (value) => value >= 58 && value <= 90
      );

      if (avgHeartRate >= 60 && avgHeartRate <= 85 && stableHeartRate) {
        unlocked.add("heart_healthy");
      }
    }
  }

  const activities = await Activity.find({
    userId,
    startTime: { $ne: null }
  })
    .select("startTime")
    .limit(250)
    .lean();

  const hasEarlyBirdActivity = activities.some((activity) => {
    const date = new Date(activity.startTime);
    return !Number.isNaN(date.getTime()) && date.getHours() < 7;
  });
  if (hasEarlyBirdActivity) unlocked.add("early_bird");

  if ((profile.shareCount || 0) > 0) unlocked.add("social_butterfly");
  if ((profile.level || 1) >= 5) unlocked.add("level_5");
  if ((profile.level || 1) >= 10) unlocked.add("level_10");

  return orderBadgeIds(unlocked);
}

async function syncProfileState(userId) {
  const today = getLocalDateKey(new Date());
  const yesterday = getYesterdayDateKey(today);

  await ensureWearableLogs({ userId, days: LOOKBACK_DAYS, uptoDate: today });

  const profile = await getOrCreateProfile(userId);

  const todayRawLog = await DailyHealthLog.findOne({ userId, date: today }).lean();
  const todayLog = todayRawLog ? toComputedHealthLog(todayRawLog) : null;
  const goals = buildDailyGoals(todayLog);

  if (!todayLog) {
    if (profile.lastUpdatedDate !== today) {
      profile.dailyPoints = 0;
      profile.streakDays = 0;
      profile.lastUpdatedDate = today;
      profile.lastSyncedMetrics = buildTodaySummary(null, goals);
    }
  } else {
    const nextDailyPoints = calculateDailyPoints(goals);

    if (profile.lastUpdatedDate === today) {
      profile.points = Math.max(
        0,
        Number(profile.points || 0) - Number(profile.dailyPoints || 0) + nextDailyPoints
      );
    } else {
      profile.points = Math.max(0, Number(profile.points || 0) + nextDailyPoints);

      if (isActiveDay(todayLog)) {
        profile.streakDays =
          profile.lastUpdatedDate === yesterday
            ? Number(profile.streakDays || 0) + 1
            : 1;
        profile.bestStreak = Math.max(
          Number(profile.bestStreak || 0),
          Number(profile.streakDays || 0)
        );
      } else {
        profile.streakDays = 0;
      }
    }

    profile.dailyPoints = nextDailyPoints;
    profile.lastUpdatedDate = today;
    profile.lastSyncedMetrics = buildTodaySummary(todayLog, goals);
  }

  profile.level = computeLevel(profile.points || 0);

  const recentLogs = await getRecentComputedLogs(userId);
  profile.badges = await computeBadgeIds({ profile, logs: recentLogs, userId });

  await profile.save();

  return {
    profile,
    dailyGoals: goals,
    todaysLog: todayLog
  };
}

/**
 * GET PROFILE
 */
export const getGamificationProfile = async (req, res) => {
  try {
    const canUseWatchData = await hasWatchDataAccess(req.user.id);
    if (!canUseWatchData) {
      return res.json(buildNoWatchDataProfile());
    }

    const { profile, dailyGoals } = await syncProfileState(req.user.id);
    res.json({
      ...serializeProfile(profile, dailyGoals),
      watchDataEnabled: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch gamification profile" });
  }
};

/**
 * SYNC DAILY POINTS
 */
export const syncGamification = async (req, res) => {
  try {
    const canUseWatchData = await hasWatchDataAccess(req.user.id);
    if (!canUseWatchData) {
      return res.json({
        message: "No watch data available for this profile",
        ...buildNoWatchDataProfile()
      });
    }

    const { profile, dailyGoals } = await syncProfileState(req.user.id);

    res.json({
      message: "Gamification synced correctly",
      ...serializeProfile(profile, dailyGoals),
      watchDataEnabled: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gamification sync failed" });
  }
};


/**
 * TODAY LEADERBOARD (FIXED)
 */
export const getTodayLeaderboard = async (req, res) => {
  try {
    const canUseWatchData = await hasWatchDataAccess(req.user.id);
    if (!canUseWatchData) {
      return res.json([]);
    }

    const leaderboard = await GamificationProfile.find()
      .populate("userId", "name email")
      .sort({ dailyPoints: -1, points: -1 })
      .limit(10)
      .lean();

    const withAccess = await Promise.all(
      leaderboard.map(async (entry) => {
        const ownerId = String(entry?.userId?._id || "").trim();
        const allowed = ownerId ? await hasWatchDataAccess(ownerId) : false;
        return { entry, allowed };
      })
    );

    const visibleEntries = withAccess
      .filter((item) => item.allowed)
      .map((item) => item.entry);

    const payload = visibleEntries.map((entry, index) => ({
      _id: entry._id,
      rank: index + 1,
      userId: entry.userId,
      dailyPoints: Number(entry.dailyPoints || 0),
      points: Number(entry.points || 0),
      level: Number(entry.level || 1),
      badgeCount: sanitizeBadgeIds(entry.badges).length,
      streakDays: Number(entry.streakDays || 0)
    }));

    res.json(payload);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
};


/**
 * RESET
 */
export const resetGamification = async (req, res) => {
  try {
    const userId = req.user.id;

    await GamificationProfile.findOneAndUpdate(
      { userId },
      {
        points: 0,
        dailyPoints: 0,
        streakDays: 0,
        bestStreak: 0,
        shareCount: 0,
        level: 1,
        badges: [],
        lastSyncedMetrics: {
          steps: 0,
          distanceMeters: 0,
          caloriesBurned: 0,
          sleepHours: 0,
          heartRateAvg: 0,
          healthScore: 0,
          overallWellness: "Needs attention",
          completedGoals: 0,
          totalGoals: 0
        }
      }
    );

    res.json({ message: "Gamification reset" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Reset failed" });
  }
};

/**
 * MARK SHARE ACTION
 */
export const markProgressShared = async (req, res) => {
  try {
    const userId = req.user.id;
    const canUseWatchData = await hasWatchDataAccess(userId);
    if (!canUseWatchData) {
      return res.status(403).json({
        message: "Watch data is unavailable for this profile"
      });
    }

    const profile = await getOrCreateProfile(userId);

    profile.shareCount = Number(profile.shareCount || 0) + 1;

    const badges = new Set(sanitizeBadgeIds(profile.badges));
    badges.add("social_butterfly");
    profile.badges = orderBadgeIds(badges);

    await profile.save();

    res.json({
      message: "Share action recorded",
      shareCount: profile.shareCount,
      badgeIds: sanitizeBadgeIds(profile.badges),
      badges: mapBadgeIdsToObjects(profile.badges)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to record share action" });
  }
};
