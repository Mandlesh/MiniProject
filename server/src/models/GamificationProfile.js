import mongoose from "mongoose";

// const gamificationProfileSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       unique: true
//     },

//     points: {
//       type: Number,
//       default: 0
//     },

//     dailyPoints: {
//       type: Number,
//       default: 0
//     },

//     level: {
//       type: Number,
//       default: 1
//     },

//     badges: {
//       type: [String],
//       default: []
//     },

//     lastUpdatedDate: {
//       type: String // YYYY-MM-DD
//     }
//   },
//   { timestamps: true }
// );

const gamificationProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },

  points: { type: Number, default: 0 },        // lifetime points
  dailyPoints: { type: Number, default: 0 },   // today only
  lastUpdatedDate: { type: String },           
  streakDays: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 },

  level: { type: Number, default: 1 },
  badges: { type: [String], default: [] },

  lastSyncedMetrics: {
    steps: { type: Number, default: 0 },
    distanceMeters: { type: Number, default: 0 },
    caloriesBurned: { type: Number, default: 0 },
    sleepHours: { type: Number, default: 0 },
    heartRateAvg: { type: Number, default: 0 },
    healthScore: { type: Number, default: 0 },
    overallWellness: { type: String, default: "Needs attention" },
    completedGoals: { type: Number, default: 0 },
    totalGoals: { type: Number, default: 0 }
  }
}, { timestamps: true });

gamificationProfileSchema.index({ dailyPoints: -1, points: -1 });

export default mongoose.model("GamificationProfile", gamificationProfileSchema);
