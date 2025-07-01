import { RequestHandler } from "express";
import multer from "multer";

// Configure multer for video uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept both video files and image files (for thumbnails)
    if (
      file.mimetype.startsWith("video/") ||
      file.mimetype.startsWith("image/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only video and image files are allowed"));
    }
  },
});

// R2 Configuration (keep credentials on server only)
const R2_CONFIG = {
  endpoint: "https://dee356186b2b200c89bcad92b58cdbb4.r2.cloudflarestorage.com",
  accessKeyId: "476e04b43df55c030ec24467678c6dc8",
  secretAccessKey:
    "db884922e96314a1752826588efe88f2edc5553de6a930ece381ef117fc79ff6",
  bucket: "incluvid",
};

/**
 * Upload video to R2 storage
 */
export const uploadVideo: RequestHandler = async (req, res) => {
  try {
    const { videoId, type } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    if (!videoId) {
      return res.status(400).json({ error: "Video ID required" });
    }

    // Determine file extension and key based on type
    let key: string;
    if (type === "thumbnail") {
      key = `thumbnails/${videoId}.jpg`;
    } else {
      const fileExtension = file.mimetype.split("/")[1] || "mp4";
      key = `videos/${videoId}.${fileExtension}`;
    }

    // Upload to R2 using AWS SDK v3
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

    const s3Client = new S3Client({
      region: "auto",
      endpoint: R2_CONFIG.endpoint,
      credentials: {
        accessKeyId: R2_CONFIG.accessKeyId,
        secretAccessKey: R2_CONFIG.secretAccessKey,
      },
    });

    const uploadCommand = new PutObjectCommand({
      Bucket: R2_CONFIG.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.size,
    });

    await s3Client.send(uploadCommand);

    // R2 public URL using R2.dev domain (no CORS issues)
    const publicUrl = `https://pub-9878674a1e04468f900a641553d1adbb.r2.dev/${key}`;

    res.json({
      success: true,
      url: publicUrl,
      key: key,
      size: file.size,
      type: file.mimetype,
    });

    console.log(`✅ Video uploaded successfully:`);
    console.log(`   Key: ${key}`);
    console.log(`   Public URL: ${publicUrl}`);
    console.log(`   Size: ${file.size} bytes`);
  } catch (error) {
    console.error("R2 Upload Error:", error);
    res.status(500).json({
      error: "Upload failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Delete video from R2 storage
 */
export const deleteVideo: RequestHandler = async (req, res) => {
  try {
    const { key } = req.params;

    if (!key) {
      return res.status(400).json({ error: "File key required" });
    }

    const { S3Client, DeleteObjectCommand } = await import(
      "@aws-sdk/client-s3"
    );

    const s3Client = new S3Client({
      region: "auto",
      endpoint: R2_CONFIG.endpoint,
      credentials: {
        accessKeyId: R2_CONFIG.accessKeyId,
        secretAccessKey: R2_CONFIG.secretAccessKey,
      },
    });

    const deleteCommand = new DeleteObjectCommand({
      Bucket: R2_CONFIG.bucket,
      Key: key,
    });

    await s3Client.send(deleteCommand);

    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("R2 Delete Error:", error);
    res.status(500).json({
      error: "Delete failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Export middleware
export const uploadMiddleware = upload.single("video");
