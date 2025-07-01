/**
 * R2 Connectivity Test Utility
 * Helps diagnose connection issues with Cloudflare R2
 */

const R2_BASE_URL =
  "https://dee356186b2b200c89bcad92b58cdbb4.r2.cloudflarestorage.com";

/**
 * Tests basic connectivity to R2 endpoint
 */
export const testR2Connectivity = async (): Promise<{
  canReach: boolean;
  error?: string;
  details?: any;
}> => {
  try {
    // Try a simple fetch to the base R2 URL
    const response = await fetch(R2_BASE_URL, {
      method: "GET",
      mode: "no-cors", // Avoid CORS issues for connectivity test
    });

    return {
      canReach: true,
      details: {
        status: response.status,
        type: response.type,
      },
    };
  } catch (error) {
    return {
      canReach: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: error,
    };
  }
};

/**
 * Tests if a specific R2 video URL is reachable
 */
export const testVideoUrl = async (
  url: string,
): Promise<{
  accessible: boolean;
  error?: string;
  details?: any;
}> => {
  try {
    // Create a video element to test if the URL works
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true; // Avoid autoplay issues

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          accessible: false,
          error: "Timeout loading video",
        });
      }, 10000); // 10 second timeout

      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        resolve({
          accessible: true,
          details: {
            duration: video.duration,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
          },
        });
      };

      video.onerror = (e) => {
        clearTimeout(timeout);
        const error = video.error;
        resolve({
          accessible: false,
          error: error
            ? `Video error code: ${error.code}`
            : "Unknown video error",
          details: error,
        });
      };

      video.src = url;
    });
  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: error,
    };
  }
};

/**
 * Runs a comprehensive connectivity test
 */
export const runConnectivityTest = async (videoUrl?: string) => {
  console.log("🔍 Running R2 connectivity test...");

  // Test 1: Basic R2 endpoint connectivity
  console.log("1. Testing R2 endpoint connectivity...");
  const endpointTest = await testR2Connectivity();
  console.log("   R2 endpoint result:", endpointTest);

  // Test 2: Network status
  console.log("2. Checking network status...");
  console.log("   Online:", navigator.onLine);
  console.log(
    "   Connection:",
    (navigator as any).connection?.effectiveType || "unknown",
  );

  // Test 3: Specific video URL (if provided)
  if (videoUrl) {
    console.log("3. Testing specific video URL...");
    const videoTest = await testVideoUrl(videoUrl);
    console.log("   Video URL result:", videoTest);
    return { endpointTest, videoTest };
  }

  return { endpointTest };
};
