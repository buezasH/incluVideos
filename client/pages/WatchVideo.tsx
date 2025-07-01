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
    const loadVideo = () => {
      try {
        // Check for user uploaded videos first
        const userVideos = JSON.parse(
          localStorage.getItem("userVideos") || "[]",
        );
        const userVideo = userVideos.find((v: any) => v.id.toString() === id);

        if (userVideo) {
          setVideo(userVideo);
          setLoading(false);
          return;
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

    if (id) {
      loadVideo();
    }
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

  return (
    <Layout>
      <div className="p-6 max-w-5xl">
        {/* Video Player */}
        <div className="bg-white rounded-lg overflow-hidden mb-6 shadow-sm">
          <div className="relative bg-gray-900 aspect-video group">
            <video
              ref={videoRef}
              src={video.videoUrl}
              poster={video.thumbnail}
              className="w-full h-full object-cover"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
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
