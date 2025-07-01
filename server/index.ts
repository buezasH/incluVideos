import express from "express";
import cors from "cors";
import { connectDB } from "./config/database";
import { handleDemo } from "./routes/demo";
import { uploadVideo, deleteVideo, uploadMiddleware } from "./routes/upload";
import { getVideo, listVideos, checkVideoExists } from "./routes/videos";
import { testR2Structure } from "./routes/r2-test";
import { register, login, getProfile, logout } from "./routes/auth";
import {
  authenticateToken,
  requireCaregiver,
  optionalAuth,
} from "./middleware/auth";

export function createServer() {
  const app = express();

  // Connect to MongoDB
  connectDB();

  // Middleware
  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    }),
  );

  // Request logging for debugging
  app.use((req, res, next) => {
    console.log(
      `${req.method} ${req.path} - Content-Type: ${req.headers["content-type"]}`,
    );
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.get("/api/auth/profile", authenticateToken, getProfile);
  app.post("/api/auth/logout", logout);

  // Protected upload routes (require Caregiver role)
  app.post(
    "/api/upload",
    authenticateToken,
    requireCaregiver,
    uploadMiddleware,
    uploadVideo,
  );
  app.delete(
    "/api/upload/:key",
    authenticateToken,
    requireCaregiver,
    deleteVideo,
  );

  // Video routes (public or optional auth)
  app.get("/api/videos/:id", optionalAuth, getVideo);
  app.get("/api/videos", optionalAuth, listVideos);
  app.get("/api/videos/check/:key", optionalAuth, checkVideoExists);

  // R2 debug routes (protected)
  app.get("/api/r2/test", authenticateToken, testR2Structure);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      mongodb:
        require("mongoose").connection.readyState === 1
          ? "connected"
          : "disconnected",
    });
  });

  return app;
}
