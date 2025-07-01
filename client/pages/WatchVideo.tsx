import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Play,
  Pause,
  Volume2,
  Maximize,
  SkipBack,
  SkipForward,
  MoreHorizontal,
  Share,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  loadVideoForPlayback,
  getVideoDisplayUrl,
  getThumbnailUrl,
} from "@/lib/videoService";
import { runConnectivityTest } from "@/lib/r2Test";
import { R2UrlTester } from "@/components/R2UrlTester";
import { VideoDebugger } from "@/components/VideoDebugger";
import { logCorsDebugInfo, testCorsHeaders } from "@/lib/corsHelper";

// Sample video data - in a real app this would come from an API
const videoData = {
  1: {
    title: "Breakfast helps you start the day with energy.",
    description:
      "Learn about healthy breakfast choices and morning routines that give you energy for the day ahead.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnail:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=450&fit=crop",
    author: {
      name: "Sarah Connors",
      avatar: "/placeholder.svg",
      title: "Caregiver",
      videoCount: 42,
    },
  },
  2: {
    title: "Morning Hygiene Steps",
    description:
      "Essential steps for a healthy morning routine including brushing teeth and personal care.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnail:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=450&fit=crop",
    author: {
      name: "Sarah Connors",
      avatar: "/placeholder.svg",
      title: "Caregiver",
      videoCount: 42,
    },
  },
};

export default function WatchVideo() {
  const { id } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Load video data
  useEffect(() => {
    const loadVideo = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError("");

        // Check network status
        console.log("Network status:", navigator.onLine ? "Online" : "Offline");
        console.log("User agent:", navigator.userAgent);

        // Try to load user video first
        const result = await loadVideoForPlayback(id);

        if (result.video) {
          const videoUrl = getVideoDisplayUrl(result.video);
          const thumbnailUrl = getThumbnailUrl(result.video);

          console.log("🎬 Loaded video:", result.video.title);
          console.log("📍 Original video URL:", result.video.videoUrl);
          console.log("🔗 Display video URL:", videoUrl);
          console.log("🖼️ Thumbnail URL:", thumbnailUrl);
          console.log(
            "☁️ Video is R2 video:",
            result.video.videoUrl.includes("r2.cloudflarestorage.com") ||
              result.video.videoUrl.includes(".r2.dev"),
          );
          console.log("🔑 Video has R2 key:", !!result.video.r2VideoKey);
          console.log("📂 R2 video key:", result.video.r2VideoKey);

          // Test if URL structure is correct
          if (
            result.video.videoUrl.includes("r2.cloudflarestorage.com") ||
            result.video.videoUrl.includes(".r2.dev")
          ) {
            const urlParts = result.video.videoUrl.split("/");
            console.log("🔍 URL parts:", urlParts);
            if (result.video.videoUrl.includes(".r2.dev")) {
              console.log("🌐 Public R2.dev URL");
              console.log("📄 File path:", urlParts.slice(3).join("/"));
            } else {
              console.log("🪣 Bucket:", urlParts[urlParts.length - 2]);
              console.log("📄 File key:", urlParts[urlParts.length - 1]);
            }
          }

          // Check if URL looks valid
          if (!videoUrl || videoUrl === "undefined") {
            setError("Invalid video URL");
            setLoading(false);
            return;
          }

          setVideo(result.video);
          setLoading(false);
          return;
        }

        if (result.error) {
          setError(result.error);
        }

        // Fall back to sample videos
        const sampleVideo = videoData[id as keyof typeof videoData];
        if (sampleVideo) {
          setVideo(sampleVideo);
          setLoading(false);
          return;
        }

        // If no video found
        setError("Video not found");
        setLoading(false);
      } catch (err) {
        console.error("Error loading video:", err);
        setError("Error loading video");
        setLoading(false);
      }
    };

    loadVideo();
  }, [id]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const updateTime = () => {
      const videoEl = videoRef.current;
      if (!videoEl) return;

      // Handle trimmed videos
      if (video.trimData) {
        const { trimStart, trimEnd } = video.trimData;
        const actualTime = videoEl.currentTime;

        if (actualTime < trimStart) {
          videoEl.currentTime = trimStart;
        } else if (actualTime >= trimEnd) {
          videoEl.currentTime = trimStart;
          videoEl.pause();
          setIsPlaying(false);
        }

        // Set relative time for display (0 to trimmed duration)
        setCurrentTime(Math.max(0, actualTime - trimStart));
      } else {
        setCurrentTime(videoEl.currentTime);
      }
    };

    const updateDuration = () => {
      if (video.trimData) {
        setDuration(video.finalDuration);
      } else {
        setDuration(videoElement.duration);
      }
    };

    videoElement.addEventListener("timeupdate", updateTime);
    videoElement.addEventListener("loadedmetadata", updateDuration);

    // If video is trimmed, start at trim point
    if (video.trimData) {
      videoElement.addEventListener("loadedmetadata", () => {
        videoElement.currentTime = video.trimData.trimStart;
      });
    }

    return () => {
      videoElement.removeEventListener("timeupdate", updateTime);
      videoElement.removeEventListener("loadedmetadata", updateDuration);
    };
  }, [video]);

  const togglePlayPause = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipTime = (seconds: number) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.currentTime = Math.max(
      0,
      Math.min(videoElement.duration, videoElement.currentTime + seconds),
    );
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    const videoElement = videoRef.current;
    if (!videoElement || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;

    if (video.trimData) {
      // For trimmed videos, seek within the trim boundaries
      const { trimStart, trimEnd } = video.trimData;
      const seekTime = trimStart + percent * (trimEnd - trimStart);
      videoElement.currentTime = Math.max(
        trimStart,
        Math.min(seekTime, trimEnd - 0.1),
      );
    } else {
      videoElement.currentTime = percent * duration;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const toggleFullscreen = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoElement.requestFullscreen();
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 max-w-5xl">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading video...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !video) {
    return (
      <Layout>
        <div className="p-6 max-w-5xl">
          <div className="bg-white rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {error || "Video not found"}
            </h2>
            <p className="text-gray-600 mb-4">
              {video
                ? "There was an issue loading the video. This might be due to network connectivity or the video file location."
                : "The video you're looking for could not be found."}
            </p>
            <div className="flex gap-3 justify-center">
              {video && (
                <button
                  onClick={() => {
                    setError("");
                    window.location.reload();
                  }}
                  className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
                >
                  Retry
                </button>
              )}
              <button
                onClick={() => window.history.back()}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Go Back
              </button>
            </div>

            {/* R2 URL Debugger for failed videos */}
            {video &&
              (video.videoUrl.includes("r2.cloudflarestorage.com") ||
                video.videoUrl.includes(".r2.dev")) && (
                <>
                  <R2UrlTester videoUrl={video.videoUrl} />
                  <VideoDebugger
                    videoUrl={video.videoUrl}
                    onTest={(result) =>
                      console.log("🔬 Debug test completed:", result)
                    }
                  />
                </>
              )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-5xl">
        {/* Video Player */}
        <div className="bg-white rounded-lg overflow-hidden mb-6 shadow-sm">
          <div className="relative bg-gray-900 aspect-video group">
            <video
              ref={videoRef}
              src={video ? getVideoDisplayUrl(video) : undefined}
              poster={video ? getThumbnailUrl(video) : undefined}
              className="w-full h-full object-cover"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              crossOrigin="anonymous"
              preload="metadata"
              onError={(e) => {
                const target = e.target as HTMLVideoElement;
                const error = target.error;

                console.error("🚨 Video load error details:");
                console.error("   Error code:", error?.code);
                console.error("   Error message:", error?.message);
                console.error("   Video src:", target.src);
                console.error("   Network state:", target.networkState);
                console.error("   Ready state:", target.readyState);
                console.error("   Current time:", target.currentTime);
                console.error("   Error object:", error);
                console.error("   Event:", e);

                // Additional debugging for R2 videos
                if (
                  target.src.includes("r2.cloudflarestorage.com") ||
                  target.src.includes(".r2.dev")
                ) {
                  console.error("🌐 R2 Video Debug Info:");
                  console.error("   Full URL:", target.src);
                  console.error("   URL accessible test incoming...");

                  // Test URL accessibility
                  fetch(target.src, { method: "HEAD", mode: "no-cors" })
                    .then(() => console.log("✅ R2 URL is reachable"))
                    .catch((err) =>
                      console.error("❌ R2 URL fetch failed:", err),
                    );
                }

                if (error) {
                  let errorMessage = "";
                  let debugInfo = "";

                  switch (error.code) {
                    case 1: // MEDIA_ERR_ABORTED
                      errorMessage = "Video loading was aborted";
                      debugInfo = "The video loading process was cancelled.";
                      break;
                    case 2: // MEDIA_ERR_NETWORK
                      errorMessage = "Network error while loading video";
                      debugInfo =
                        "Check your internet connection and CORS configuration.";
                      break;
                    case 3: // MEDIA_ERR_DECODE
                      errorMessage = "Video format error or corrupted file";
                      debugInfo =
                        "The video file may be corrupted or in an unsupported format.";
                      break;
                    case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
                      errorMessage =
                        "Video format not supported or file not found";
                      debugInfo =
                        "The video URL may be incorrect or the file format is not supported.";
                      break;
                    default:
                      errorMessage = `Video error (code: ${error.code})`;
                      debugInfo = `Unknown error type: ${error.code}`;
                  }

                  console.error(
                    `📝 Error Details: ${errorMessage} - ${debugInfo}`,
                  );
                  setError(`${errorMessage}. ${debugInfo}`);

                  // Run connectivity test for R2 videos
                  if (
                    video &&
                    (video.videoUrl.includes("r2.cloudflarestorage.com") ||
                      video.videoUrl.includes(".r2.dev"))
                  ) {
                    console.log(
                      "🔍 Video failed to load, running comprehensive debugging...",
                    );
                    runConnectivityTest(video.videoUrl);
                    logCorsDebugInfo();
                    testCorsHeaders(video.videoUrl);
                  }
                } else {
                  setError("Unknown video loading error");
                }
              }}
              onLoadStart={() => {
                console.log("Video loading started");
                console.log(
                  "Video source:",
                  video ? getVideoDisplayUrl(video) : "no video",
                );
              }}
              onCanPlay={() => console.log("Video can play")}
              onLoadedData={() => console.log("Video data loaded")}
              onLoadedMetadata={() => console.log("Video metadata loaded")}
              onWaiting={() => console.log("Video buffering")}
              onStalled={() => console.log("Video stalled")}
              onSuspend={() => console.log("Video loading suspended")}
              onAbort={() => console.log("Video loading aborted")}
              onEmptied={() => console.log("Video emptied")}
            />

            {/* Central Play Button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-16 w-16 bg-white/20 hover:bg-white/30 text-white"
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8" />
                )}
              </Button>
            </div>

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Progress Bar */}
              <div
                className="w-full bg-white/20 rounded-full h-1 mb-4 cursor-pointer"
                onClick={handleProgressClick}
              >
                <div
                  className="bg-primary h-1 rounded-full transition-all"
                  style={{
                    width: duration
                      ? `${(currentTime / duration) * 100}%`
                      : "0%",
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => skipTime(-10)}
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => skipTime(10)}
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => {
                      const newVolume = volume > 0 ? 0 : 1;
                      setVolume(newVolume);
                      if (videoRef.current) videoRef.current.volume = newVolume;
                    }}
                  >
                    <Volume2 className="h-5 w-5" />
                  </Button>
                  <span className="text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={toggleFullscreen}
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Info */}
        <div className="bg-white rounded-lg p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {video.title}
          </h1>
          <p className="text-gray-600 mb-4">{video.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={video.author.avatar}
                  alt={video.author.name}
                />
                <AvatarFallback>
                  {video.author.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-gray-900">
                  {video.author.name}
                </div>
                <div className="text-sm text-gray-600">
                  {video.author.title} • {video.author.videoCount} Educational
                  Videos
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button className="bg-primary hover:bg-primary/90">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
