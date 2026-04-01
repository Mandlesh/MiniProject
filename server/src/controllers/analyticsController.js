import DailyHealthLog from "../models/DailyHealthLog.js";
import {
  ensureWearableLogs,
  hasWatchDataAccess,
  summarizeHealthLogs
} from "../services/wearableDataService.js";

function emptyAnalytics() {
  return {
    summary: {
      totalSteps: 0,
      totalCaloriesBurned: 0,
      totalDistanceMeters: 0,
      avgHeartRate: 0,
      avgRestingHeartRate: 0,
      avgSleep: 0,
      avgHealthScore: 0,
      overallWellness: "Needs attention",
      activeDays: 0
    },
    dailyData: []
  };
}

async function getAnalyticsForPeriod(userId, days) {
  const canUseWatchData = await hasWatchDataAccess(userId);
  if (!canUseWatchData) {
    return emptyAnalytics();
  }

  await ensureWearableLogs({ userId, days });

  const logs = await DailyHealthLog.find({ userId })
    .sort({ date: -1 })
    .limit(days)
    .lean();

  const ordered = [...logs].reverse();
  const { summary, dailyData } = summarizeHealthLogs(ordered);

  return {
    summary,
    dailyData
  };
}

/**
 * WEEKLY ANALYTICS
 * GET /api/analytics/weekly
 */
export const getWeeklyAnalytics = async (req, res) => {
  try {
    const analytics = await getAnalyticsForPeriod(req.user.id, 7);
    res.status(200).json(analytics);
  } catch (error) {
    console.log(error.message);
    
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * MONTHLY ANALYTICS
 * GET /api/analytics/monthly
 */
export const getMonthlyAnalytics = async (req, res) => {
  try {
    const analytics = await getAnalyticsForPeriod(req.user.id, 30);
    res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
