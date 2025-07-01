import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { uploadVideo, deleteVideo, uploadMiddleware } from "./routes/upload";
import { getVideo, listVideos, checkVideoExists } from "./routes/videos";

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

  // Video routes
  app.get("/api/videos/:id", getVideo);
  app.get("/api/videos", listVideos);
  app.get("/api/videos/check/:key", checkVideoExists);

  return app;
}
