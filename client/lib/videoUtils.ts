/**
 * Generates a thumbnail from a video file
 * @param videoFile - The video file to generate thumbnail from
 * @param timeSeconds - Time in seconds to capture (default: 2 seconds)
 * @returns Promise that resolves to thumbnail data URL
 */
export const generateVideoThumbnail = (
  videoFile: File | string,
  timeSeconds: number = 2,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    video.preload = "metadata";
    video.crossOrigin = "anonymous";

    video.onloadedmetadata = () => {
      // Use second 0 if video is shorter than 2 seconds
      const seekTime =
        video.duration < 2 ? 0 : Math.min(timeSeconds, video.duration - 0.1);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      try {
        // Set canvas size to video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to data URL
        const thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.8);

        // Clean up
        video.remove();
        canvas.remove();

        resolve(thumbnailDataUrl);
      } catch (error) {
        reject(error);
      }
    };

    video.onerror = () => {
      reject(new Error("Error loading video for thumbnail generation"));
    };

    // Set video source
    if (typeof videoFile === "string") {
      video.src = videoFile;
    } else {
      video.src = URL.createObjectURL(videoFile);
    }

    video.load();
  });
};

/**
 * Generates a thumbnail with specific dimensions (for consistent sizing)
 * @param videoFile - The video file to generate thumbnail from
 * @param width - Desired thumbnail width
 * @param height - Desired thumbnail height
 * @param timeSeconds - Time in seconds to capture
 * @returns Promise that resolves to thumbnail data URL
 */
export const generateVideoThumbnailWithSize = (
  videoFile: File | string,
  width: number = 400,
  height: number = 300,
  timeSeconds: number = 2,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    video.preload = "metadata";
    video.crossOrigin = "anonymous";

    video.onloadedmetadata = () => {
      const seekTime =
        video.duration < 2 ? 0 : Math.min(timeSeconds, video.duration - 0.1);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      try {
        // Set canvas to desired dimensions
        canvas.width = width;
        canvas.height = height;

        // Calculate scaling to maintain aspect ratio
        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = width / height;

        let drawWidth = width;
        let drawHeight = height;
        let offsetX = 0;
        let offsetY = 0;

        if (videoAspect > canvasAspect) {
          // Video is wider than canvas
          drawHeight = width / videoAspect;
          offsetY = (height - drawHeight) / 2;
        } else {
          // Video is taller than canvas
          drawWidth = height * videoAspect;
          offsetX = (width - drawWidth) / 2;
        }

        // Fill background with black
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);

        // Draw the video frame centered
        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

        const thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.8);

        // Clean up
        video.remove();
        canvas.remove();

        resolve(thumbnailDataUrl);
      } catch (error) {
        reject(error);
      }
    };

    video.onerror = () => {
      reject(new Error("Error loading video for thumbnail generation"));
    };

    // Set video source
    if (typeof videoFile === "string") {
      video.src = videoFile;
    } else {
      video.src = URL.createObjectURL(videoFile);
    }

    video.load();
  });
};
