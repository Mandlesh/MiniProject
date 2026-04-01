import DailyHealthLog from "../models/DailyHealthLog.js";
import { generateAISummary } from "../services/aiService.js";
import {
  ensureWearableLogs,
  hasWatchDataAccess,
  summarizeHealthLogs
} from "../services/wearableDataService.js";

const VALID_STATUS = new Set(["Recovered", "Improving", "Needs Attention"]);
const VALID_TREND = new Set(["Positive", "Neutral", "Negative"]);

const cleanAIJson = (text) => {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
};

function formatSleepChange(delta) {
  const value = Number(delta);
  if (!Number.isFinite(value) || Math.abs(value) < 0.1) return "+0hrs";
  return `${value > 0 ? "+" : ""}${Number(value.toFixed(1))}hrs`;
}

function deriveStatusFromScore(score) {
  if (score >= 85) return "Recovered";
  if (score >= 65) return "Improving";
  return "Needs Attention";
}

function deriveTrend({
  currentScore,
  previousScore,
  currentSteps,
  previousSteps,
  currentSleep,
  previousSleep
}) {
  const scoreDelta = currentScore - previousScore;
  const stepsDelta = currentSteps - previousSteps;
  const sleepDelta = currentSleep - previousSleep;

  let signal = 0;
  if (scoreDelta >= 2) signal += 1;
  if (scoreDelta <= -2) signal -= 1;

  if (stepsDelta >= 600) signal += 1;
  if (stepsDelta <= -600) signal -= 1;

  if (sleepDelta >= 0.2) signal += 1;
  if (sleepDelta <= -0.2) signal -= 1;

  if (signal >= 2) return "Positive";
  if (signal <= -2) return "Negative";
  return "Neutral";
}

function createFallbackSummary(metrics) {
  const {
    avgSteps,
    avgSleep,
    avgHeartRate,
    avgCalories,
    avgDistanceMeters,
    avgHealthScore,
    overallWellness,
    status,
    trend,
    sleepChange
  } = metrics;

  const summaryText =
    `You averaged ${avgSteps.toLocaleString()} steps/day, ` +
    `${avgSleep.toFixed(1)} hours of sleep, and ${avgHeartRate} bpm this week. ` +
    `Your health score is ${avgHealthScore}/100 (${overallWellness}) with ` +
    `${avgCalories} kcal burned and ${(avgDistanceMeters / 1000).toFixed(1)} km walked daily.`;

  const sleepAdvice =
    sleepChange < 0
      ? "Your sleep has dipped this week. Try sleeping 30 minutes earlier and avoid screens before bed."
      : "Your sleep pattern is steady. Keep a consistent bedtime and maintain hydration for better recovery.";

  return {
    summaryText,
    sleepAdvice,
    status,
    trend,
    recommendations: [
      {
        title: "Daily walk target",
        description: "Aim for at least 7,500 steps and one 15-minute brisk walk every day."
      },
      {
        title: "Recovery and sleep",
        description: "Keep a fixed sleep window and target 7.5 to 8.5 hours for recovery."
      },
      {
        title: "Heart health",
        description: "Add light cardio 3 times a week to keep heart rate trends in the healthy zone."
      }
    ]
  };
}

function sanitizeRecommendations(recommendations, fallbackRecommendations) {
  if (!Array.isArray(recommendations)) {
    return fallbackRecommendations;
  }

  const cleaned = recommendations
    .filter((item) => item && (item.title || item.description))
    .map((item) => ({
      title: String(item.title || "Health Action").trim(),
      description: String(item.description || "Continue healthy habits this week.").trim()
    }))
    .filter((item) => item.title || item.description)
    .slice(0, 5);

  return cleaned.length > 0 ? cleaned : fallbackRecommendations;
}

function sanitizeAiData(aiData, fallback, fallbackStatus, fallbackTrend) {
  const status = VALID_STATUS.has(aiData?.status) ? aiData.status : fallbackStatus;
  const trend = VALID_TREND.has(aiData?.trend) ? aiData.trend : fallbackTrend;

  return {
    summaryText:
      typeof aiData?.summaryText === "string" && aiData.summaryText.trim()
        ? aiData.summaryText.trim()
        : fallback.summaryText,
    sleepAdvice:
      typeof aiData?.sleepAdvice === "string" && aiData.sleepAdvice.trim()
        ? aiData.sleepAdvice.trim()
        : fallback.sleepAdvice,
    status,
    trend,
    recommendations: sanitizeRecommendations(
      aiData?.recommendations,
      fallback.recommendations
    )
  };
}

function buildPrompt(metrics) {
  return `
User health data (last 7 days):
- Average steps per day: ${metrics.avgSteps}
- Average sleep hours: ${metrics.avgSleep.toFixed(1)}
- Average heart rate: ${metrics.avgHeartRate} bpm
- Average resting heart rate: ${metrics.avgRestingHeartRate} bpm
- Average calories burned per day: ${metrics.avgCalories}
- Average distance walked per day: ${(metrics.avgDistanceMeters / 1000).toFixed(2)} km
- Average health score: ${metrics.avgHealthScore}/100
- Overall wellness: ${metrics.overallWellness}
- Weekly sleep change: ${formatSleepChange(metrics.sleepChange)}

Generate a concise weekly health insight based on this wearable tracking profile.

Return ONLY valid JSON. No markdown. No explanations.

{
  "summaryText": "2 line weekly health summary",
  "sleepAdvice": "1 sleep improvement advice",
  "status": "Recovered | Improving | Needs Attention",
  "trend": "Positive | Neutral | Negative",
  "recommendations": [
    { "title": "Short title", "description": "Short description" },
    { "title": "Short title", "description": "Short description" },
    { "title": "Short title", "description": "Short description" }
  ]
}
`;
}

function noWatchDataPayload() {
  return {
    weeklyPulse: {
      summaryText: "No watch data is linked to this profile.",
      sleepAdvice: "Connect your owner watch profile to view AI insights.",
      updatedAt: new Date().toISOString()
    },
    keyInsights: {
      steps: 0,
      avgSleep: 0,
      sleepChange: "+0hrs",
      avgHeartRate: 0,
      avgRestingHeartRate: 0,
      caloriesBurned: 0,
      distanceMeters: 0,
      healthScore: 0,
      overallWellness: "Needs attention",
      status: "Needs Attention",
      trend: "Neutral"
    },
    recommendations: []
  };
}

export const getAISummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const canUseWatchData = await hasWatchDataAccess(userId);
    if (!canUseWatchData) {
      return res.json(noWatchDataPayload());
    }

    await ensureWearableLogs({ userId, days: 45 });

    // 1️⃣ Fetch last 14 days for trend comparison
    const logs = await DailyHealthLog.find({ userId })
      .sort({ date: -1 })
      .limit(14)
      .lean();

    const recentLogs = logs.slice(0, 7);
    const previousLogs = logs.slice(7, 14);

    const currentSummary = summarizeHealthLogs(recentLogs).summary;
    const previousSummary = summarizeHealthLogs(
      previousLogs.length > 0 ? previousLogs : recentLogs
    ).summary;

    const recentDays = Math.max(recentLogs.length, 1);
    const previousDays = Math.max(previousLogs.length, 1);

    const avgSteps = Math.round(currentSummary.totalSteps / recentDays);
    const avgSleep = Number(currentSummary.avgSleep || 0);
    const avgHeartRate = Math.round(currentSummary.avgHeartRate || 0);
    const avgRestingHeartRate = Math.round(
      currentSummary.avgRestingHeartRate || 0
    );
    const avgCalories = Math.round(currentSummary.totalCaloriesBurned / recentDays);
    const avgDistanceMeters = Math.round(
      currentSummary.totalDistanceMeters / recentDays
    );
    const avgHealthScore = Math.round(currentSummary.avgHealthScore || 0);
    const overallWellness = currentSummary.overallWellness || "Good";

    const previousAvgSteps = Math.round(previousSummary.totalSteps / previousDays);
    const previousAvgSleep = Number(previousSummary.avgSleep || 0);
    const previousAvgHealthScore = Math.round(previousSummary.avgHealthScore || 0);

    const sleepChange = Number((avgSleep - previousAvgSleep).toFixed(1));

    const defaultStatus = deriveStatusFromScore(avgHealthScore);
    const defaultTrend = deriveTrend({
      currentScore: avgHealthScore,
      previousScore: previousAvgHealthScore,
      currentSteps: avgSteps,
      previousSteps: previousAvgSteps,
      currentSleep: avgSleep,
      previousSleep: previousAvgSleep
    });

    const metricSnapshot = {
      avgSteps,
      avgSleep,
      avgHeartRate,
      avgRestingHeartRate,
      avgCalories,
      avgDistanceMeters,
      avgHealthScore,
      overallWellness,
      sleepChange,
      status: defaultStatus,
      trend: defaultTrend
    };

    const fallbackData = createFallbackSummary(metricSnapshot);

    let aiData = fallbackData;

    if (process.env.GROQ_API_KEY) {
      try {
        const prompt = buildPrompt(metricSnapshot);
        const aiRaw = await generateAISummary(prompt);
        const cleaned = cleanAIJson(aiRaw);
        const parsed = JSON.parse(cleaned);
        aiData = sanitizeAiData(
          parsed,
          fallbackData,
          defaultStatus,
          defaultTrend
        );
      } catch (aiError) {
        console.error("AI summary generation failed. Falling back.", aiError.message);
      }
    }

    // 2️⃣ UI-ready response
    res.json({
      weeklyPulse: {
        summaryText: aiData.summaryText,
        sleepAdvice: aiData.sleepAdvice,
        updatedAt: new Date().toISOString()
      },
      keyInsights: {
        steps: avgSteps,
        avgSleep,
        sleepChange: formatSleepChange(sleepChange),
        avgHeartRate,
        avgRestingHeartRate,
        caloriesBurned: avgCalories,
        distanceMeters: avgDistanceMeters,
        healthScore: avgHealthScore,
        overallWellness,
        status: aiData.status,
        trend: aiData.trend
      },
      recommendations: aiData.recommendations
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI summary failed" });
  }
};
