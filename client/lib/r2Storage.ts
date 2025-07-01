/**
 * Cloudflare R2 Storage Service
 * Handles video and thumbnail uploads to Cloudflare R2
 */

const R2_ENDPOINT =
  "https://dee356186b2b200c89bcad92b58cdbb4.r2.cloudflarestorage.com/incluvid";

export interface UploadResult {
  url: string;
  key: string;
}

/**
 * Uploads a file to Cloudflare R2
 * @param file - File to upload
 * @param key - Storage key/path for the file
 * @returns Promise with upload result
 */
export const uploadToR2 = async (
  file: File | Blob,
  key: string,
): Promise<UploadResult> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("key", key);

    const response = await fetch(`${R2_ENDPOINT}/${key}`, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Upload failed: ${response.status} ${response.statusText}`,
      );
    }

    const url = `${R2_ENDPOINT}/${key}`;

    return {
      url,
      key,
    };
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw new Error(
      `Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

/**
 * Uploads a video file to R2
 * @param videoFile - Video file to upload
 * @param videoId - Unique identifier for the video
 * @returns Promise with upload result
 */
export const uploadVideoToR2 = async (
  videoFile: File,
  videoId: string,
): Promise<UploadResult> => {
  const fileExtension = videoFile.name.split(".").pop() || "mp4";
  const key = `videos/${videoId}.${fileExtension}`;
  return uploadToR2(videoFile, key);
};

/**
 * Uploads a thumbnail to R2
 * @param thumbnailBlob - Thumbnail blob data
 * @param videoId - Video ID this thumbnail belongs to
 * @returns Promise with upload result
 */
export const uploadThumbnailToR2 = async (
  thumbnailBlob: Blob,
  videoId: string,
): Promise<UploadResult> => {
  const key = `thumbnails/${videoId}.jpg`;
  return uploadToR2(thumbnailBlob, key);
};

/**
 * Uploads a thumbnail from data URL to R2
 * @param thumbnailDataUrl - Thumbnail as data URL
 * @param videoId - Video ID this thumbnail belongs to
 * @returns Promise with upload result
 */
export const uploadThumbnailDataUrlToR2 = async (
  thumbnailDataUrl: string,
  videoId: string,
): Promise<UploadResult> => {
  // Convert data URL to blob
  const response = await fetch(thumbnailDataUrl);
  const blob = await response.blob();

  return uploadThumbnailToR2(blob, videoId);
};

/**
 * Deletes a file from R2
 * @param key - Storage key of the file to delete
 * @returns Promise indicating success
 */
export const deleteFromR2 = async (key: string): Promise<void> => {
  try {
    const response = await fetch(`${R2_ENDPOINT}/${key}`, {
      method: "DELETE",
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(
        `Delete failed: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    console.error("Error deleting from R2:", error);
    throw new Error(
      `Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

/**
 * Deletes video and thumbnail from R2
 * @param videoId - Video ID to delete
 * @param fileExtension - Video file extension
 * @returns Promise indicating success
 */
export const deleteVideoFromR2 = async (
  videoId: string,
  fileExtension: string = "mp4",
): Promise<void> => {
  const videoKey = `videos/${videoId}.${fileExtension}`;
  const thumbnailKey = `thumbnails/${videoId}.jpg`;

  // Delete both video and thumbnail (ignore errors if files don't exist)
  await Promise.allSettled([
    deleteFromR2(videoKey),
    deleteFromR2(thumbnailKey),
  ]);
};

/**
 * Generates a unique video ID
 * @returns Unique video ID string
 */
export const generateVideoId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Gets the public URL for an R2 object
 * @param key - Storage key
 * @returns Public URL
 */
export const getR2Url = (key: string): string => {
  return `${R2_ENDPOINT}/${key}`;
};

/**
 * Extracts the storage key from an R2 URL
 * @param url - R2 URL
 * @returns Storage key
 */
export const extractKeyFromUrl = (url: string): string => {
  return url.replace(`${R2_ENDPOINT}/`, "");
};
