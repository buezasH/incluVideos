import { RequestHandler } from "express";

/**
 * Get video information by ID
 */
export const getVideo: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Video ID required" });
    }

    // In a real application, you would fetch from a database
    // For now, we'll return a placeholder response indicating the video exists in R2
    // The frontend should use localStorage for video metadata and R2 URLs for playback

    res.json({
      id,
      message: "Video metadata should be retrieved from localStorage",
      note: "Video files are served directly from Cloudflare R2",
    });
  } catch (error) {
    console.error("Error fetching video:", error);
    res.status(500).json({
      error: "Failed to fetch video",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * List all videos (if needed for admin purposes)
 */
export const listVideos: RequestHandler = async (req, res) => {
  try {
    // In a real application, you would fetch from a database
    res.json({
      message: "Video listing should be retrieved from localStorage",
      note: "This endpoint could be used for server-side video management in the future",
    });
  } catch (error) {
    console.error("Error listing videos:", error);
    res.status(500).json({
      error: "Failed to list videos",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Check if a video exists in R2 storage
 */
export const checkVideoExists: RequestHandler = async (req, res) => {
  try {
    const { key } = req.params;

    if (!key) {
      return res.status(400).json({ error: "Video key required" });
    }

    // Check if video exists in R2
    const { S3Client, HeadObjectCommand } = await import("@aws-sdk/client-s3");

    const R2_CONFIG = {
      endpoint:
        "https://dee356186b2b200c89bcad92b58cdbb4.r2.cloudflarestorage.com",
      accessKeyId: "476e04b43df55c030ec24467678c6dc8",
      secretAccessKey:
        "db884922e96314a1752826588efe88f2edc5553de6a930ece381ef117fc79ff6",
      bucket: "incluvid",
    };

    const s3Client = new S3Client({
      region: "auto",
      endpoint: R2_CONFIG.endpoint,
      credentials: {
        accessKeyId: R2_CONFIG.accessKeyId,
        secretAccessKey: R2_CONFIG.secretAccessKey,
      },
    });

    const headCommand = new HeadObjectCommand({
      Bucket: R2_CONFIG.bucket,
      Key: key,
    });

    try {
      const result = await s3Client.send(headCommand);
      res.json({
        exists: true,
        size: result.ContentLength,
        lastModified: result.LastModified,
        contentType: result.ContentType,
      });
    } catch (error: any) {
      if (error.name === "NotFound") {
        res.json({ exists: false });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("Error checking video existence:", error);
    res.status(500).json({
      error: "Failed to check video",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
