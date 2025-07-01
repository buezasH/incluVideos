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
 * Loads and validates a video for playback
 */
export const loadVideoForPlayback = async (
  id: string,
): Promise<{
  video: VideoData | null;
  error?: string;
  accessible?: boolean;
}> => {
  try {
    // Get video from localStorage
    const video = getVideoById(id);
    if (!video) {
      return { video: null, error: "Video not found" };
    }

    // Check if video URL is accessible
    const { videoAccessible } = await validateVideoUrls(video);

    if (!videoAccessible) {
      console.warn(`Video ${id} URL not accessible:`, video.videoUrl);
      return {
        video,
        accessible: false,
        error: "Video file not accessible. It may have been moved or deleted.",
      };
    }

    return { video, accessible: true };
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
    video.videoUrl.includes("r2.cloudflarestorage.com") || !!video.r2VideoKey
  );
};

/**
 * Gets the display URL for video (handles both R2 and local URLs)
 */
export const getVideoDisplayUrl = (video: VideoData): string => {
  // For R2 videos, use the direct URL
  if (isR2Video(video)) {
    return video.videoUrl;
  }

  // For local videos, the URL should work as-is (blob URLs or data URLs)
  return video.videoUrl;
};

/**
 * Generates a video thumbnail URL
 */
export const getThumbnailUrl = (video: VideoData): string => {
  return video.thumbnail || video.videoUrl;
};
