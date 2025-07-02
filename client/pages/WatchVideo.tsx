import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  SkipBack,
  SkipForward,
  MoreHorizontal,
  Share,
  Subtitles,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  loadVideoForPlayback,
  getVideoDisplayUrl,
  getThumbnailUrl,
} from "@/lib/videoService";
import { getVideoMetadata } from "@/lib/videoMetadataService";
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
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
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
      avatar:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=100&h=100&fit=crop&crop=face",
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
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [chapters, setChapters] = useState<
    {
      id: string;
      title: string;
      startTime: number;
      endTime: number;
    }[]
  >([]);
  const [currentChapter, setCurrentChapter] = useState<{
    id: string;
    title: string;
    startTime: number;
    endTime: number;
  } | null>(null);

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

        // Try to load video from MongoDB first
        try {
          console.log("🔍 Attempting to load video metadata from MongoDB...");
          const videoMetadata = await getVideoMetadata(id);

          if (videoMetadata) {
            console.log(
              "✅ Video metadata loaded from MongoDB:",
              videoMetadata.title,
            );
            // Fetch uploader information
            let uploaderInfo = {
              name: "Content Creator",
              avatar:
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
              title: "Caregiver",
              videoCount: 1,
            };

            if (videoMetadata.userId) {
              try {
                const token = localStorage.getItem("auth_token");
                let userId: string;

                // Handle different types of userId (ObjectId vs string)
                if (typeof videoMetadata.userId === "string") {
                  userId = videoMetadata.userId;
                } else if (
                  videoMetadata.userId &&
                  typeof videoMetadata.userId === "object"
                ) {
                  // If it's an ObjectId object, extract the string representation
                  userId =
                    (videoMetadata.userId as any)._id ||
                    videoMetadata.userId.toString();
                } else {
                  userId = String(videoMetadata.userId);
                }

                console.log("Fetching uploader info for userId:", userId);

                if (
                  token &&
                  userId &&
                  userId !== "undefined" &&
                  userId !== "[object Object]"
                ) {
                  const response = await fetch(`/api/auth/profile/${userId}`, {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  });

                  if (response.ok) {
                    const userProfile = await response.json();
                    console.log("User profile fetched:", userProfile);
                    uploaderInfo = {
                      name: userProfile.username || "Content Creator",
                      avatar:
                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
                      title: userProfile.role || "Caregiver",
                      videoCount: userProfile.videoCount || 1,
                    };
                  } else {
                    console.log(
                      "Failed to fetch uploader info:",
                      response.status,
                    );
                  }
                } else {
                  console.log("Invalid userId, skipping user fetch:", userId);
                }
              } catch (userError: any) {
                console.log(
                  "Could not fetch uploader info, using defaults:",
                  userError?.message || userError,
                );

                // Check if it's an authentication error
                if (
                  userError?.message?.includes("401") ||
                  userError?.message?.includes("Unauthorized")
                ) {
                  console.log("🔐 User info requires authentication");
                } else if (userError?.message?.includes("Failed to fetch")) {
                  console.log("🌐 Network error fetching user info");
                }
              }
            }

            const videoData = {
              ...videoMetadata,
              videoUrl: getVideoDisplayUrl(videoMetadata),
              thumbnail: getThumbnailUrl(videoMetadata),
              author: uploaderInfo,
            };

            // Load chapters if available
            if (videoMetadata.chapters && videoMetadata.chapters.length > 0) {
              setChapters(videoMetadata.chapters);
              console.log("📖 Chapters loaded:", videoMetadata.chapters);
            }

            setVideo(videoData);
            setLoading(false);
            return;
          }
        } catch (mongoError: any) {
          console.log("📝 MongoDB video load failed:", mongoError.message);

          // Check if it's an authentication error
          if (
            mongoError.message?.includes("401") ||
            mongoError.message?.includes("Unauthorized")
          ) {
            console.log("🔐 Authentication required - user needs to log in");
          } else if (mongoError.message?.includes("Failed to fetch")) {
            console.log("🌐 Network error - check server connection");
          }

          console.log("📦 Falling back to legacy storage...");
        }

        // Fallback to legacy localStorage method
        const result = await loadVideoForPlayback(id);

        if (result.video) {
          const videoUrl = getVideoDisplayUrl(result.video);
          const thumbnailUrl = getThumbnailUrl(result.video);

          console.log("🎬 Loaded video:", result.video.title);
          console.log("📍 Original video URL:", result.video.videoUrl);
          console.log("🔗 Display video URL:", videoUrl);
          console.log("🖼️ Thumbnail URL:", thumbnailUrl);
          console.log(
            "��️ Video is R2 video:",
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
        const displayTime = Math.max(0, actualTime - trimStart);
        setCurrentTime(displayTime);

        // Update current chapter
        const chapter = getCurrentChapter(displayTime);
        setCurrentChapter(chapter);
      } else {
        setCurrentTime(videoEl.currentTime);

        // Update current chapter
        const chapter = getCurrentChapter(videoEl.currentTime);
        setCurrentChapter(chapter);
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

  // Chapter utility functions
  const getCurrentChapter = (time: number) => {
    return (
      chapters.find(
        (chapter) => time >= chapter.startTime && time < chapter.endTime,
      ) || null
    );
  };

  const jumpToChapter = (chapter: { startTime: number }) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.currentTime = chapter.startTime;
    setCurrentTime(chapter.startTime);
  };

  const getNextChapter = () => {
    if (!currentChapter) return chapters[0] || null;
    const currentIndex = chapters.findIndex(
      (ch) => ch.id === currentChapter.id,
    );
    return chapters[currentIndex + 1] || null;
  };

  const getPreviousChapter = () => {
    if (!currentChapter) return null;
    const currentIndex = chapters.findIndex(
      (ch) => ch.id === currentChapter.id,
    );
    return chapters[currentIndex - 1] || null;
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

                console.error("�� Video load error details:");
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
              {/* Current Chapter Title */}
              {currentChapter && (
                <div className="mb-2 text-center">
                  <div className="inline-block bg-black/60 backdrop-blur-sm rounded-full px-4 py-1">
                    <span className="text-white text-sm font-medium">
                      📖 {currentChapter.title}
                    </span>
                  </div>
                </div>
              )}
              {/* Progress Bar */}
              <div
                className="w-full bg-white/20 rounded-full h-1 mb-4 cursor-pointer relative"
                onClick={handleProgressClick}
              >
                {/* Chapter markers */}
                {chapters.length > 0 &&
                  duration > 0 &&
                  chapters.map((chapter, index) => (
                    <React.Fragment key={chapter.id}>
                      {/* Chapter start marker (except for first chapter) */}
                      {index > 0 && (
                        <div
                          className="absolute top-0 w-0.5 h-full bg-white/60 cursor-pointer hover:bg-white z-10"
                          style={{
                            left: `${Math.max(0, Math.min(100, (chapter.startTime / duration) * 100))}%`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            jumpToChapter(chapter);
                          }}
                          title={`Jump to: ${chapter.title}`}
                        />
                      )}

                      {/* Chapter background color */}
                      <div
                        className={`absolute top-0 h-full rounded-full ${
                          currentChapter?.id === chapter.id
                            ? "bg-blue-400/30"
                            : "bg-white/10"
                        }`}
                        style={{
                          left: `${Math.max(0, Math.min(100, (chapter.startTime / duration) * 100))}%`,
                          width: `${Math.max(0, Math.min(100, ((chapter.endTime - chapter.startTime) / duration) * 100))}%`,
                        }}
                      />
                    </React.Fragment>
                  ))}

                {/* Progress indicator */}
                <div
                  className="bg-primary h-1 rounded-full transition-all relative z-20"
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

                  {/* Chapter Navigation */}
                  {chapters.length > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={() => {
                          const prevChapter = getPreviousChapter();
                          if (prevChapter) jumpToChapter(prevChapter);
                        }}
                        disabled={!getPreviousChapter()}
                        title="Previous Chapter"
                      >
                        <SkipBack className="h-4 w-4" />
                        <span className="text-xs">CH</span>
                      </Button>
                    </>
                  )}

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

                  {/* Chapter Navigation */}
                  {chapters.length > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={() => {
                          const nextChapter = getNextChapter();
                          if (nextChapter) jumpToChapter(nextChapter);
                        }}
                        disabled={!getNextChapter()}
                        title="Next Chapter"
                      >
                        <span className="text-xs">CH</span>
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => skipTime(10)}
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                  {/* Volume Control */}
                  <div
                    className="flex items-center space-x-2"
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={() => {
                        const newMuted = !isMuted;
                        setIsMuted(newMuted);
                        if (videoRef.current) {
                          videoRef.current.muted = newMuted;
                        }
                      }}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="h-5 w-5" />
                      ) : volume < 0.5 ? (
                        <Volume1 className="h-5 w-5" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                    </Button>

                    {/* Volume Slider */}
                    {showVolumeSlider && (
                      <div className="flex items-center bg-black/40 rounded px-2 py-1">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={isMuted ? 0 : volume}
                          onChange={(e) => {
                            const newVolume = parseFloat(e.target.value);
                            setVolume(newVolume);
                            setIsMuted(newVolume === 0);
                            if (videoRef.current) {
                              videoRef.current.volume = newVolume;
                              videoRef.current.muted = newVolume === 0;
                            }
                          }}
                          className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                            [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm
                            [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full
                            [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
                        />
                        <span className="text-xs ml-2 min-w-[2rem]">
                          {Math.round((isMuted ? 0 : volume) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => {
                      // TODO: Implement subtitles toggle functionality
                      console.log("Subtitles toggle clicked");
                    }}
                    title="Toggle Subtitles"
                  >
                    <Subtitles className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={toggleFullscreen}
                    title="Toggle Fullscreen"
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
