/**
 * Video Service
 * Handles video loading, validation, and metadata management
 */

export interface VideoData {
  id: string | number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  r2VideoKey?: string;
  r2ThumbnailKey?: string;
  author: {
    name: string;
    avatar: string;
    title: string;
    videoCount: number;
  };
  uploadedAt: string;
  originalDuration: number;
  finalDuration: number;
  wasTrimmed: boolean;
  trimData?: any;
}

/**
 * Gets video data by ID from localStorage
 */
export const getVideoById = (id: string): VideoData | null => {
  try {
    const userVideos = JSON.parse(localStorage.getItem("userVideos") || "[]");
    return userVideos.find((v: VideoData) => v.id.toString() === id) || null;
  } catch {
    return null;
  }
};

/**
 * Loads a video for playback (simplified to avoid CORS issues)
 */
export const loadVideoForPlayback = async (
  id: string,
): Promise<{
  video: VideoData | null;
  error?: string;
}> => {
  try {
    // Get video from localStorage
    const video = getVideoById(id);
    if (!video) {
      return { video: null, error: "Video not found" };
    }

    // Return video data - let the video element handle loading/errors
    return { video };
  } catch (error) {
    console.error("Error loading video:", error);
    return { video: null, error: "Failed to load video" };
  }
};

/**
 * Updates video metadata in localStorage
 */
export const updateVideoMetadata = (
  id: string,
  updates: Partial<VideoData>,
): boolean => {
  try {
    const userVideos = JSON.parse(localStorage.getItem("userVideos") || "[]");
    const videoIndex = userVideos.findIndex(
      (v: VideoData) => v.id.toString() === id,
    );

    if (videoIndex === -1) {
      return false;
    }

    userVideos[videoIndex] = { ...userVideos[videoIndex], ...updates };
    localStorage.setItem("userVideos", JSON.stringify(userVideos));
    return true;
  } catch {
    return false;
  }
};

/**
 * Gets all user videos from localStorage
 */
export const getAllUserVideos = (): VideoData[] => {
  try {
    return JSON.parse(localStorage.getItem("userVideos") || "[]");
  } catch {
    return [];
  }
};

/**
 * Checks if a video is stored in R2 or locally
 */
export const isR2Video = (video: VideoData): boolean => {
  return (
    video.videoUrl.includes("r2.cloudflarestorage.com") ||
    video.videoUrl.includes(".r2.dev") ||
    !!video.r2VideoKey
  );
};

/**
 * Gets the display URL for video (handles both R2 and local URLs)
 */
export const getVideoDisplayUrl = (video: VideoData): string => {
  // For R2 videos, convert to public R2.dev URL if needed
  if (isR2Video(video)) {
    let url = video.videoUrl;

    // Convert S3 API URLs to public R2.dev URLs
    if (url.includes("r2.cloudflarestorage.com/incluvid/")) {
      const key = url.split("/incluvid/")[1];
      url = `https://pub-9878674a1e04468f900a641553d1adbb.r2.dev/${key}`;
      console.log(`🔄 Converted S3 URL to public R2.dev URL: ${url}`);
    } else if (url.includes(".r2.dev")) {
      console.log(`✅ Already using public R2.dev URL: ${url}`);
    }

    return url;
  }

  // For local videos, the URL should work as-is (blob URLs or data URLs)
  console.log(`🔗 Local Video URL: ${video.videoUrl}`);
  return video.videoUrl;
};

/**
 * Generates a video thumbnail URL (handles both R2 and local URLs)
 */
export const getThumbnailUrl = (video: VideoData): string => {
  let thumbnailUrl = video.thumbnail || video.videoUrl;

  // Convert S3 API URLs to public R2.dev URLs for thumbnails
  if (thumbnailUrl.includes("r2.cloudflarestorage.com/incluvid/")) {
    const key = thumbnailUrl.split("/incluvid/")[1];
    thumbnailUrl = `https://pub-9878674a1e04468f900a641553d1adbb.r2.dev/${key}`;
    console.log(
      `🔄 Converted thumbnail S3 URL to public R2.dev URL: ${thumbnailUrl}`,
    );
  } else if (thumbnailUrl.includes(".r2.dev")) {
    console.log(
      `✅ Already using public R2.dev thumbnail URL: ${thumbnailUrl}`,
    );
  }

  return thumbnailUrl;
};
