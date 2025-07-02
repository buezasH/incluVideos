/**
 * Video Metadata Service
 * Handles video metadata operations with MongoDB backend
 */

export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  category?: string;
  tags: string[];
  videoUrl: string;
  thumbnailUrl?: string;
  r2VideoKey: string;
  r2ThumbnailKey?: string;
  userId: string;
  duration: number;
  originalDuration: number;
  finalDuration: number;
  wasTrimmed: boolean;
  trimData?: {
    trimStart: number;
    trimEnd: number;
    trimmedDuration: number;
  };
  chapters?: {
    id: string;
    title: string;
    startTime: number;
    endTime: number;
  }[];
  uploadedAt: string;
  lastEditedAt?: string;
  views: number;
  isPublic: boolean;
  accessibilityFeatures: {
    hasSubtitles: boolean;
    hasAudioDescription: boolean;
    hasSignLanguage: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateVideoData {
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  videoUrl: string;
  thumbnailUrl?: string;
  r2VideoKey: string;
  r2ThumbnailKey?: string;
  duration: number;
  originalDuration?: number;
  finalDuration?: number;
  wasTrimmed?: boolean;
  trimData?: {
    trimStart: number;
    trimEnd: number;
    trimmedDuration: number;
  };
  chapters?: {
    id: string;
    title: string;
    startTime: number;
    endTime: number;
  }[];
  isPublic?: boolean;
  accessibilityFeatures?: {
    hasSubtitles: boolean;
    hasAudioDescription: boolean;
    hasSignLanguage: boolean;
  };
}

export interface UpdateVideoData extends Partial<CreateVideoData> {}

export interface VideoListResponse {
  success: boolean;
  videos: VideoMetadata[];
  pagination: {
    current: number;
    total: number;
    count: number;
    totalVideos: number;
  };
}

// Get authentication token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem("auth_token");
};

// Get authentication headers
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Create new video metadata
 */
export const createVideoMetadata = async (
  videoData: CreateVideoData,
): Promise<VideoMetadata> => {
  try {
    const response = await fetch("/api/videos", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(videoData),
    });

    if (!response.ok) {
      let errorMessage = `Failed to create video: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.video;
  } catch (error) {
    console.error("Create video metadata error:", error);
    throw error;
  }
};

/**
 * Get video metadata by ID
 */
// Robust fetch wrapper that handles network issues
const robustFetch = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  // Add default timeout and error handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      // Add additional headers for better compatibility
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Handle different types of network errors
    if (error.name === "AbortError") {
      throw new Error("Request timeout - server may be slow");
    } else if (error.message.includes("Failed to fetch")) {
      throw new Error("Network connection failed - check internet connection");
    } else {
      throw error;
    }
  }
};

export const getVideoMetadata = async (id: string): Promise<VideoMetadata> => {
  // Retry logic for fetch failures
  const maxRetries = 3;
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🔍 Fetching video metadata for ID: ${id} (attempt ${attempt}/${maxRetries})`,
      );
      const headers = getAuthHeaders();
      console.log("📤 Request headers:", headers);

      const response = await robustFetch(`/api/videos/${id}`, {
        headers,
      });

      console.log("📥 Response status:", response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `Failed to get video: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.log("❌ Error response data:", errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.log("❌ Could not parse error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("✅ Video metadata loaded:", data);
      return data.video;
    } catch (error: any) {
      lastError = error;
      console.error(`Get video metadata error (attempt ${attempt}):`, error);

      // Check if it's a network error
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        console.error("🌐 Network error - this could be due to:");
        console.error("   - Server not running");
        console.error("   - CORS issues");
        console.error("   - Network connectivity");
        console.error("   - Invalid URL");
      } else if (error.name === "AbortError") {
        console.error("⏱️ Request timeout");
      }

      // If this isn't the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = attempt * 1000; // Progressive delay: 1s, 2s, 3s
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
};

/**
 * Get list of videos with filtering and pagination
 */
export const getVideos = async (params?: {
  page?: number;
  limit?: number;
  category?: string;
  tags?: string[];
  userId?: string;
  search?: string;
  myVideos?: boolean;
}): Promise<VideoListResponse> => {
  try {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.category) searchParams.append("category", params.category);
    if (params?.tags)
      params.tags.forEach((tag) => searchParams.append("tags", tag));
    if (params?.userId) searchParams.append("userId", params.userId);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.myVideos) searchParams.append("myVideos", "true");

    const response = await fetch(`/api/videos?${searchParams.toString()}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      let errorMessage = `Failed to get videos: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("Get videos error:", error);
    throw error;
  }
};

/**
 * Update video metadata
 */
export const updateVideoMetadata = async (
  id: string,
  updateData: UpdateVideoData,
): Promise<VideoMetadata> => {
  try {
    const response = await fetch(`/api/videos/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      let errorMessage = `Failed to update video: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.video;
  } catch (error) {
    console.error("Update video metadata error:", error);
    throw error;
  }
};

/**
 * Delete video metadata
 */
export const deleteVideoMetadata = async (
  id: string,
): Promise<{ r2VideoKey: string; r2ThumbnailKey?: string }> => {
  try {
    const response = await fetch(`/api/videos/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      let errorMessage = `Failed to delete video: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.deletedVideo;
  } catch (error) {
    console.error("Delete video metadata error:", error);
    throw error;
  }
};

/**
 * Get user's videos (convenience function)
 */
export const getUserVideos = async (
  page = 1,
  limit = 10,
): Promise<VideoListResponse> => {
  return getVideos({ page, limit, myVideos: true });
};

/**
 * Search videos (convenience function)
 */
export const searchVideos = async (
  query: string,
  page = 1,
  limit = 10,
): Promise<VideoListResponse> => {
  return getVideos({ page, limit, search: query });
};
