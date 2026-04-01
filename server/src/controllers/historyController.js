import DailyHealthLog from "../models/DailyHealthLog.js";
import Activity from "../models/Activity.js";
import {
  ensureWearableLogs,
  hasWatchDataAccess,
  toDateKey,
  toComputedHealthLog
} from "../services/wearableDataService.js";

export const getHealthHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const canUseWatchData = await hasWatchDataAccess(userId);
    if (!canUseWatchData) {
      return res.json({ history: [] });
    }

    const days = Math.max(1, Math.min(365, Number(req.query.days || 30)));

    await ensureWearableLogs({ userId, days });

    // 1️⃣ Fetch daily logs
    const logs = await DailyHealthLog.find({ userId })
      .sort({ date: -1 })
      .limit(days)
      .lean();

    // 2️⃣ Fetch activities for same period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await Activity.find({
      userId,
      startTime: { $gte: startDate }
    }).lean();

    // 3️⃣ Group activities by date
    const activityMap = {};
    activities.forEach(act => {
      const date = toDateKey(act.startTime);
      if (!activityMap[date]) activityMap[date] = [];
      activityMap[date].push({
        type: act.type,
        durationMin: act.durationMin,
        calories: act.calories || 0
      });
    });

    // 4️⃣ Merge logs + activities
    const history = logs.map((log) => {
      const computed = toComputedHealthLog(log);

      return {
        date: computed.date,
        steps: computed.steps || 0,
        distance: Number((computed.distanceMeters / 1000).toFixed(2)),
        calories: computed.caloriesBurned || 0,
        heartRateAvg: computed.heartRateAvg || 0,
        sleep: computed.sleep,
        healthScore: computed.healthScore,
        overallWellness: computed.overallWellness,
        activities: activityMap[computed.date] || []
      };
    });

    res.json({ history });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch history" });
  }
};
