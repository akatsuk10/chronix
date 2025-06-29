import { Router } from "express";
import { getAllBets, getUserBets, getBetStats, getRecentBets } from "../controllers/bet.controller";

const router = Router();

// Get all bets with pagination and optional user filter
router.get("/", getAllBets);

// Get bets for a specific user
router.get("/user/:userAddress", getUserBets);

// Get betting statistics
router.get("/stats", getBetStats);

// Get recent bets
router.get("/recent", getRecentBets);

export default router; 