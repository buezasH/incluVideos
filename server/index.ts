import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { uploadVideo, deleteVideo, uploadMiddleware } from "./routes/upload";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // Upload routes
  app.post("/api/upload", uploadMiddleware, uploadVideo);
  app.delete("/api/upload/:key", deleteVideo);

  return app;
}
