import { RequestHandler } from "express";

/**
 * Test R2 bucket structure and accessibility
 */
export const testR2Structure: RequestHandler = async (req, res) => {
  try {
    const { S3Client, ListObjectsV2Command } = await import(
      "@aws-sdk/client-s3"
    );

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

    // List some objects in the bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_CONFIG.bucket,
      MaxKeys: 10,
    });

    const result = await s3Client.send(listCommand);

    const objects =
      result.Contents?.map((obj) => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        publicUrl: `${R2_CONFIG.endpoint}/${R2_CONFIG.bucket}/${obj.Key}`,
      })) || [];

    res.json({
      success: true,
      bucketName: R2_CONFIG.bucket,
      endpoint: R2_CONFIG.endpoint,
      objectCount: result.KeyCount || 0,
      objects: objects,
      publicUrlFormat: `${R2_CONFIG.endpoint}/${R2_CONFIG.bucket}/[key]`,
      sampleUrls: {
        video: `${R2_CONFIG.endpoint}/${R2_CONFIG.bucket}/videos/example-id.mp4`,
        thumbnail: `${R2_CONFIG.endpoint}/${R2_CONFIG.bucket}/thumbnails/example-id.jpg`,
      },
    });
  } catch (error) {
    console.error("R2 test error:", error);
    res.status(500).json({
      error: "Failed to test R2 structure",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
