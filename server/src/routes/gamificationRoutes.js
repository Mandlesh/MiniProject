import express from "express";
import {
  getGamificationProfile,
  syncGamification,
  resetGamification,
  getTodayLeaderboard,
  markProgressShared
} from "../controllers/gamificationController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔐 protect all gamification routes
router.use(authMiddleware);

// 1️⃣ Get gamification profile
router.get("/profile", getGamificationProfile);

// 2️⃣ Sync / evaluate gamification (like syncDailyHealth)
router.post("/sync", syncGamification);

// 3️⃣ Reset (dev only)
router.post("/reset", resetGamification);

// 4️⃣ Track share action and unlock social badge
router.post("/share", markProgressShared);

router.get("/leaderboard/today", getTodayLeaderboard);


export default router;
