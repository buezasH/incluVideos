/**
 * Video Storage Service
 * Handles video and thumbnail storage with R2 fallback to IndexedDB
 */

import { setStorageMethod } from "./storageStatus";

const R2_ENDPOINT =
  "https://dee356186b2b200c89bcad92b58cdbb4.r2.cloudflarestorage.com/incluvid";

export interface UploadResult {
  url: string;
  key: string;
}

// IndexedDB helper for fallback storage
class VideoStorage {
  private dbName = "IncluVidStorage";
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("videos")) {
          db.createObjectStore("videos", { keyPath: "key" });
        }
      };
    });
  }

  async store(key: string, file: File | Blob): Promise<string> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["videos"], "readwrite");
      const store = transaction.objectStore("videos");

      // Convert file to ArrayBuffer for storage
      const reader = new FileReader();
      reader.onload = () => {
        const data = {
          key,
          data: reader.result,
          type: file.type,
          size: file.size,
          timestamp: Date.now(),
        };

        const request = store.put(data);
        request.onsuccess = () => {
          // Return a blob URL for the stored file
          const blob = new Blob([reader.result as ArrayBuffer], {
            type: file.type,
          });
          const url = URL.createObjectURL(blob);
          resolve(url);
        };
        request.onerror = () => reject(request.error);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  async retrieve(key: string): Promise<Blob | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["videos"], "readonly");
      const store = transaction.objectStore("videos");
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const blob = new Blob([result.data], { type: result.type });
          resolve(blob);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["videos"], "readwrite");
      const store = transaction.objectStore("videos");
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const videoStorage = new VideoStorage();

/**
 * Uploads a file with R2 fallback to IndexedDB
 * @param file - File to upload
 * @param key - Storage key/path for the file
 * @returns Promise with upload result
 */
export const uploadToR2 = async (
  file: File | Blob,
  key: string,
): Promise<UploadResult> => {
  try {
    // Try R2 upload first
    const response = await fetch(`${R2_ENDPOINT}/${key}`, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
    });

    if (response.ok) {
      const url = `${R2_ENDPOINT}/${key}`;
      return { url, key };
    } else {
      throw new Error(
        `R2 upload failed: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    console.warn("R2 upload failed, using local storage:", error);

    // Fallback to IndexedDB
    try {
      const url = await videoStorage.store(key, file);
      return { url, key };
    } catch (fallbackError) {
      console.error("Fallback storage also failed:", fallbackError);
      throw new Error(
        `Both R2 and local storage failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
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
 * Deletes a file with R2 fallback to IndexedDB
 * @param key - Storage key of the file to delete
 * @returns Promise indicating success
 */
export const deleteFromR2 = async (key: string): Promise<void> => {
  try {
    // Try R2 delete first
    const response = await fetch(`${R2_ENDPOINT}/${key}`, {
      method: "DELETE",
    });

    if (response.ok || response.status === 404) {
      return; // Successfully deleted or doesn't exist
    } else {
      throw new Error(
        `R2 delete failed: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    console.warn("R2 delete failed, trying local storage:", error);

    // Fallback to IndexedDB deletion
    try {
      await videoStorage.delete(key);
    } catch (fallbackError) {
      console.warn("Local storage delete also failed:", fallbackError);
      // Don't throw error for delete operations, just log it
    }
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
