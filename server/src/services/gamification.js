export const GAMIFICATION_BADGES = [
	{
		id: "first_steps",
		name: "First Steps",
		description: "Complete your first 1,000 steps",
		icon: "🚶"
	},
	{
		id: "step_master",
		name: "Step Master",
		description: "Reach 10,000 steps in a day",
		icon: "🏃"
	},
	{
		id: "marathon_walker",
		name: "Marathon Walker",
		description: "Walk 50,000 steps in a week",
		icon: "🏆"
	},
	{
		id: "sleep_champion",
		name: "Sleep Champion",
		description: "Get 8+ hours sleep for 7 days",
		icon: "😴"
	},
	{
		id: "early_bird",
		name: "Early Bird",
		description: "Log activity before 7 AM",
		icon: "🌅"
	},
	{
		id: "calorie_crusher",
		name: "Calorie Crusher",
		description: "Burn 500+ calories in a day",
		icon: "🔥"
	},
	{
		id: "consistency_king",
		name: "Consistency King",
		description: "Log health data for 30 days",
		icon: "📅"
	},
	{
		id: "heart_healthy",
		name: "Heart Healthy",
		description: "Maintain optimal heart rate",
		icon: "❤️"
	},
	{
		id: "hydration_hero",
		name: "Hydration Hero",
		description: "Meet hydration goal for 5 days",
		icon: "💧"
	},
	{
		id: "social_butterfly",
		name: "Social Butterfly",
		description: "Share your progress",
		icon: "📣"
	},
	{
		id: "level_5",
		name: "Rising Star",
		description: "Reach Level 5",
		icon: "⭐"
	},
	{
		id: "level_10",
		name: "Health Champion",
		description: "Reach Level 10",
		icon: "🥇"
	}
];

const BADGE_MAP = new Map(GAMIFICATION_BADGES.map((badge) => [badge.id, badge]));

function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}

function toDateObject(value) {
	const date =
		value instanceof Date
			? new Date(value)
			: typeof value === "string"
			? new Date(`${value}T00:00:00`)
			: new Date();

	if (Number.isNaN(date.getTime())) return null;

	date.setHours(0, 0, 0, 0);
	return date;
}

export function getLocalDateKey(value = new Date()) {
	const date = toDateObject(value);
	if (!date) return null;

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

export function getYesterdayDateKey(value = new Date()) {
	const date = toDateObject(value);
	if (!date) return null;

	date.setDate(date.getDate() - 1);
	return getLocalDateKey(date);
}

export function computeLevel(points = 0) {
	return Math.max(1, Math.floor((Number(points) || 0) / 100) + 1);
}

export function sanitizeBadgeIds(badges) {
	const source = Array.isArray(badges) ? badges : [];
	const ids = source
		.map((item) => {
			if (typeof item === "string") return item;
			if (item && typeof item.id === "string") return item.id;
			return null;
		})
		.filter(Boolean);

	return Array.from(new Set(ids));
}

export function mapBadgeIdsToObjects(badgeIds) {
	return sanitizeBadgeIds(badgeIds)
		.map((id) => BADGE_MAP.get(id))
		.filter(Boolean);
}

export function buildDailyGoals(todayLog) {
	if (!todayLog) {
		return [];
	}

	const goals = [
		{
			id: "log_activity",
			label: "Log Activity",
			xp: 10,
			done: true
		},
		{
			id: "steps_8k",
			label: "8,000+ Steps",
			xp: 20,
			done: (todayLog.steps || 0) >= 8000
		},
		{
			id: "steps_12k",
			label: "12,000+ Steps",
			xp: 10,
			done: (todayLog.steps || 0) >= 12000
		},
		{
			id: "calories_400",
			label: "400+ Calories",
			xp: 20,
			done: (todayLog.caloriesBurned || 0) >= 400
		},
		{
			id: "sleep_7h",
			label: "7+ Hours Sleep",
			xp: 20,
			done: (todayLog?.sleep?.duration || 0) >= 7
		},
		{
			id: "distance_6k",
			label: "6km Distance",
			xp: 10,
			done: (todayLog.distanceMeters || 0) >= 6000
		},
		{
			id: "heart_balanced",
			label: "Balanced Heart Rate",
			xp: 10,
			done:
				(todayLog.heartRateAvg || 0) >= 60 &&
				(todayLog.heartRateAvg || 0) <= 85
		},
		{
			id: "health_score_80",
			label: "Health Score 80+",
			xp: 20,
			done: (todayLog.healthScore || 0) >= 80
		}
	];

	return goals;
}

export function calculateDailyPoints(goals) {
	return (Array.isArray(goals) ? goals : []).reduce(
		(sum, goal) => sum + (goal.done ? Number(goal.xp) || 0 : 0),
		0
	);
}

export function countCompletedGoals(goals) {
	return (Array.isArray(goals) ? goals : []).filter((goal) => goal.done).length;
}

export function isActiveDay(log) {
	if (!log) return false;

	return (
		(log.steps || 0) >= 3000 ||
		(log.caloriesBurned || 0) >= 220 ||
		(log.healthScore || 0) >= 55
	);
}

export function hasRollingStepsGoal(logs, threshold = 50000, window = 7) {
	const values = logs.map((log) => Number(log.steps) || 0);
	if (values.length < window) return false;

	for (let start = 0; start <= values.length - window; start += 1) {
		const total = values
			.slice(start, start + window)
			.reduce((sum, stepValue) => sum + stepValue, 0);
		if (total >= threshold) return true;
	}

	return false;
}

export function hasSleepChampion(logs) {
	if (logs.length < 7) return false;

	for (let start = 0; start <= logs.length - 7; start += 1) {
		const streak = logs
			.slice(start, start + 7)
			.every((log) => Number(log?.sleep?.duration || 0) >= 8);

		if (streak) return true;
	}

	return false;
}

export function buildTodaySummary(todayLog, goals) {
	if (!todayLog) {
		return {
			steps: 0,
			distanceMeters: 0,
			caloriesBurned: 0,
			sleepHours: 0,
			heartRateAvg: 0,
			healthScore: 0,
			overallWellness: "Needs attention",
			completedGoals: 0,
			totalGoals: 0
		};
	}

	return {
		steps: Number(todayLog.steps || 0),
		distanceMeters: Number(todayLog.distanceMeters || 0),
		caloriesBurned: Number(todayLog.caloriesBurned || 0),
		sleepHours: Number(todayLog?.sleep?.duration || 0),
		heartRateAvg: Number(todayLog.heartRateAvg || 0),
		healthScore: Number(todayLog.healthScore || 0),
		overallWellness: todayLog.overallWellness || "Good",
		completedGoals: countCompletedGoals(goals),
		totalGoals: Array.isArray(goals) ? goals.length : 0
	};
}

export function calculateProgressPercent(points) {
	const remainder = Math.max(0, Number(points) || 0) % 100;
	return clamp(Math.round(remainder), 0, 100);
}