import DailyHealthLog from "../models/DailyHealthLog.js";
import {
  ensureWearableLogs,
  hasWatchDataAccess,
  toComputedHealthLog,
  toDateKey
} from "../services/wearableDataService.js";

const MS_IN_DAY = 24 * 60 * 60 * 1000;

function normalizeDateInput(dateValue) {
  const key = toDateKey(dateValue);
  if (!key) return null;

  const parsed = new Date(`${key}T00:00:00`);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

/**
 * 1️⃣ CREATE or UPDATE daily health log
 * POST /api/health/sync
 */
export const syncDailyHealth = async (req, res) => {
  try {
    const userId = req.user.id;
    const canUseWatchData = await hasWatchDataAccess(userId);
    if (!canUseWatchData) {
      return res.status(403).json({
        message: "Watch data is only enabled for the owner profile"
      });
    }

    const { date, ...healthData } = req.body;
    const normalizedDateKey = toDateKey(date);

    if (!normalizedDateKey) {
      return res.status(400).json({ message: "Date is required" });
    }

    const payload = {
      ...healthData,
      userId,
      date: normalizedDateKey
    };

    if (
      (payload.distance === undefined || payload.distance === null) &&
      Number.isFinite(Number(payload.steps))
    ) {
      payload.distance = Math.round(Number(payload.steps) * 0.75);
    }

    if (payload?.sleep?.quality === "bad") {
      payload.sleep.quality = "poor";
    }

    const log = await DailyHealthLog.findOneAndUpdate(
      { userId, date: normalizedDateKey },
      {
        $set: {
          ...payload
        }
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    res.status(200).json({
      message: "Daily health synced successfully",
      data: toComputedHealthLog(log.toObject())
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 2️⃣ GET health log by date
 * GET /api/health/day/:date
 */
export const getHealthByDate = async (req, res) => {
  try {
    const userId = req.user.id;
    const canUseWatchData = await hasWatchDataAccess(userId);
    if (!canUseWatchData) {
      return res.status(404).json({ message: "No watch data found for this profile" });
    }

    const { date } = req.params;
    const requestedDate = normalizeDateInput(date);

    if (!requestedDate) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const today = normalizeDateInput(new Date());
    if (requestedDate > today) {
      return res.status(404).json({ message: "No health data found" });
    }

    const daysToEnsure =
      Math.floor((today.getTime() - requestedDate.getTime()) / MS_IN_DAY) + 1;

    await ensureWearableLogs({
      userId,
      days: Math.max(30, daysToEnsure),
      uptoDate: today
    });

    const log = await DailyHealthLog.findOne({
      userId,
      date: toDateKey(requestedDate)
    }).lean();

    if (!log) {
      return res.status(404).json({ message: "No health data found" });
    }

    res.status(200).json(toComputedHealthLog(log));
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 3️⃣ GET health logs by date range
 * GET /api/health/range?start=YYYY-MM-DD&end=YYYY-MM-DD
 */
export const getHealthByRange = async (req, res) => {
  try {
    const userId = req.user.id;
    const canUseWatchData = await hasWatchDataAccess(userId);
    if (!canUseWatchData) {
      return res.status(200).json([]);
    }

    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ message: "Start and end dates required" });
    }

    const startDate = normalizeDateInput(start);
    const endDate = normalizeDateInput(end);

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (endDate < startDate) {
      return res
        .status(400)
        .json({ message: "End date must be after start date" });
    }

    const today = normalizeDateInput(new Date());
    const boundedEnd = endDate > today ? today : endDate;

    const daysToEnsure =
      Math.floor((boundedEnd.getTime() - startDate.getTime()) / MS_IN_DAY) + 1;

    if (daysToEnsure > 0) {
      await ensureWearableLogs({
        userId,
        days: Math.max(daysToEnsure, 30),
        uptoDate: boundedEnd
      });
    }

    const logs = await DailyHealthLog.find({
      userId,
      date: {
        $gte: toDateKey(startDate),
        $lte: toDateKey(boundedEnd)
      }
    })
      .sort({ date: 1 })
      .lean();

    res.status(200).json(logs.map((log) => toComputedHealthLog(log)));
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
