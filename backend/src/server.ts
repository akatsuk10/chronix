import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route";
import betRoutes from "./routes/bet.route";
import { startListening, stopListening } from "./services/eventListener";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "Chronix.bet Backend",
    version: "1.0.0"
  });
});

// Event listener management endpoint
app.post("/api/events/restart", async (req: Request, res: Response) => {
  try {
    console.log("Manually restarting event listener...");
    await stopListening();
    await startListening();
    res.json({ 
      success: true, 
      message: "Event listener restarted successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error restarting event listener:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to restart event listener",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/bets", betRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  try {
    // Start listening for events
    await startListening();
    
    // Optionally process historical events (uncomment if needed)
    // await processHistoricalEvents(0); // From block 0
  } catch (error) {
    console.error("Failed to start event listener:", error);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await stopListening();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  await stopListening();
  process.exit(0);
});
