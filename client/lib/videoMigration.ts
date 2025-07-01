/**
 * Video Migration Utility
 * Helps migrate existing localStorage videos to maintain compatibility
 */

import {
  uploadVideoToR2,
  uploadThumbnailDataUrlToR2,
  generateVideoId,
} from "./r2Storage";

interface LegacyVideo {
  id: number;
  title: string;
  description: string;
  videoUrl: string; // This will be a blob URL
  thumbnail: string;
  author: any;
  uploadedAt: string;
  originalDuration: number;
  finalDuration: number;
  wasTrimmed: boolean;
  trimData: any;
}

interface ModernVideo extends LegacyVideo {
  id: string;
  r2VideoKey?: string;
  r2ThumbnailKey?: string;
}

/**
 * Checks if a video needs migration to R2
 * @param video - Video object to check
 * @returns true if migration is needed
 */
export const needsMigration = (video: any): boolean => {
  // If video has blob URL or no R2 keys, it needs migration
  return (
    video.videoUrl?.startsWith("blob:") ||
    (!video.r2VideoKey && !video.videoUrl?.includes("r2.cloudflarestorage.com"))
  );
};

/**
 * Migrates a single video to R2 storage
 * @param video - Legacy video object
 * @returns Promise with migrated video
 */
export const migrateVideoToR2 = async (
  video: LegacyVideo,
): Promise<ModernVideo> => {
  if (!needsMigration(video)) {
    return video as ModernVideo;
  }

  try {
    const videoId = generateVideoId();

    // If the video has a blob URL, we can't migrate it (blob URLs are temporary)
    // In this case, we'll mark it as needing re-upload
    if (video.videoUrl.startsWith("blob:")) {
      return {
        ...video,
        id: videoId,
        videoUrl: "", // Clear the invalid blob URL
        thumbnail: video.thumbnail.startsWith("blob:") ? "" : video.thumbnail,
        r2VideoKey: undefined,
        r2ThumbnailKey: undefined,
      };
    }

    // For videos that are already URLs but not R2 URLs, we can try to migrate
    let videoUrl = video.videoUrl;
    let thumbnailUrl = video.thumbnail;
    let r2VideoKey: string | undefined;
    let r2ThumbnailKey: string | undefined;

    // If it's a data URL or blob URL for thumbnail, upload it
    if (
      video.thumbnail &&
      (video.thumbnail.startsWith("data:") ||
        video.thumbnail.startsWith("blob:"))
    ) {
      try {
        const thumbnailResult = await uploadThumbnailDataUrlToR2(
          video.thumbnail,
          videoId,
        );
        thumbnailUrl = thumbnailResult.url;
        r2ThumbnailKey = thumbnailResult.key;
      } catch (error) {
        console.warn("Failed to migrate thumbnail for video:", video.id, error);
      }
    }

    return {
      ...video,
      id: videoId,
      videoUrl,
      thumbnail: thumbnailUrl,
      r2VideoKey,
      r2ThumbnailKey,
    };
  } catch (error) {
    console.error("Error migrating video:", video.id, error);
    // Return the video as-is if migration fails
    return {
      ...video,
      id: video.id.toString(),
    };
  }
};

/**
 * Migrates all videos in localStorage to R2 compatible format
 * @returns Promise with migration results
 */
export const migrateAllVideos = async (): Promise<{
  migrated: number;
  failed: number;
  needsReupload: number;
}> => {
  const userVideos = JSON.parse(localStorage.getItem("userVideos") || "[]");
  const results = { migrated: 0, failed: 0, needsReupload: 0 };

  if (userVideos.length === 0) {
    return results;
  }

  const migratedVideos: ModernVideo[] = [];

  for (const video of userVideos) {
    try {
      const migratedVideo = await migrateVideoToR2(video);

      if (!migratedVideo.videoUrl) {
        results.needsReupload++;
      } else if (
        migratedVideo.r2VideoKey ||
        migratedVideo.videoUrl.includes("r2.cloudflarestorage.com")
      ) {
        results.migrated++;
      }

      migratedVideos.push(migratedVideo);
    } catch (error) {
      console.error("Failed to migrate video:", video.id, error);
      results.failed++;
      // Keep the original video if migration fails
      migratedVideos.push({
        ...video,
        id: video.id.toString(),
      });
    }
  }

  // Save migrated videos back to localStorage
  localStorage.setItem("userVideos", JSON.stringify(migratedVideos));

  return results;
};

/**
 * Gets videos that need to be re-uploaded
 * @returns Array of videos that need re-uploading
 */
export const getVideosNeedingReupload = (): ModernVideo[] => {
  const userVideos = JSON.parse(localStorage.getItem("userVideos") || "[]");
  return userVideos.filter(
    (video: ModernVideo) =>
      !video.videoUrl || video.videoUrl.startsWith("blob:"),
  );
};
