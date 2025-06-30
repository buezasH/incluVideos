import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Pause, Volume2, Maximize, Scissors } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function EditVideo() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [editMode, setEditMode] = useState<"trim" | "split" | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [splitPoint, setSplitPoint] = useState(0);
  const [uploadData, setUploadData] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [trimmedVideoUrl, setTrimmedVideoUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Load upload data from localStorage
    const storedData = localStorage.getItem("pendingVideoUpload");
    if (storedData) {
      const data = JSON.parse(storedData);
      setUploadData(data);
      setVideoUrl(data.fileUrl);
    } else {
      // If no upload data, redirect to upload page
      navigate("/upload");
    }
  }, [navigate]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      const videoDuration = video.duration;
      setDuration(videoDuration);
      setTrimStart(0);
      setTrimEnd(videoDuration);
      setSplitPoint(videoDuration / 2);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () =>
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
  }, [videoUrl]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seekToTime = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const newTime = clickPercent * duration;

    if (editMode === "trim") {
      // Set trim points based on click
      if (Math.abs(newTime - trimStart) < Math.abs(newTime - trimEnd)) {
        setTrimStart(Math.max(0, Math.min(newTime, trimEnd - 1)));
      } else {
        setTrimEnd(Math.min(duration, Math.max(newTime, trimStart + 1)));
      }
    } else if (editMode === "split") {
      setSplitPoint(newTime);
    } else {
      seekToTime(newTime);
    }
  };

  const startTrimMode = () => {
    setEditMode("trim");
    setTrimStart(0);
    setTrimEnd(duration);
  };

  const startSplitMode = () => {
    setEditMode("split");
    setSplitPoint(currentTime);
  };

  const cancelEdit = () => {
    setEditMode(null);
  };

  const trimVideo = async () => {
    if (!videoRef.current || editMode !== "trim") return;

    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Create MediaRecorder to capture the trimmed video
      const stream = canvas.captureStream(30); // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const trimmedBlob = new Blob(chunks, { type: "video/webm" });
        const trimmedUrl = URL.createObjectURL(trimmedBlob);
        setTrimmedVideoUrl(trimmedUrl);
        setVideoUrl(trimmedUrl);
        setIsProcessing(false);
        setEditMode(null);

        // Reset video to show trimmed version
        if (videoRef.current) {
          videoRef.current.src = trimmedUrl;
          videoRef.current.load();
        }
      };

      // Start recording
      mediaRecorder.start();

      // Pause the original video and seek to trim start
      video.pause();
      video.currentTime = trimStart;

      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      // Function to draw frames during the trim duration
      const drawFrame = () => {
        if (video.currentTime >= trimEnd) {
          mediaRecorder.stop();
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Advance video time by a small amount (1/30 second for 30fps)
        video.currentTime += 1 / 30;

        if (video.currentTime < trimEnd) {
          requestAnimationFrame(drawFrame);
        } else {
          mediaRecorder.stop();
        }
      };

      // Start drawing frames
      drawFrame();
    } catch (error) {
      console.error("Error trimming video:", error);
      alert(
        "Error trimming video. This feature requires a modern browser with MediaRecorder support.",
      );
      setIsProcessing(false);
    }
  };

  const applyEdit = () => {
    if (editMode === "trim") {
      trimVideo();
    } else if (editMode === "split") {
      alert(`Splitting video at ${Math.floor(splitPoint)}s`);
      setEditMode(null);
    }
  };

  const handleUploadVideo = () => {
    // Create a new video entry and clear upload data
    const videoId = Date.now(); // Simple ID generation
    const finalVideoUrl = trimmedVideoUrl || videoUrl; // Use trimmed version if available

    const finalVideoData = {
      id: videoId,
      title: uploadData.title,
      description: uploadData.description,
      videoUrl: finalVideoUrl,
      thumbnail: finalVideoUrl, // In real app, would generate thumbnail
      author: {
        name: "Current User",
        avatar: "/placeholder.svg",
        title: "Content Creator",
        videoCount: 1,
      },
      uploadedAt: new Date().toISOString(),
      originalDuration: duration,
      finalDuration: trimmedVideoUrl ? trimEnd - trimStart : duration,
      wasTrimmed: !!trimmedVideoUrl,
      trimData: trimmedVideoUrl ? { trimStart, trimEnd } : null,
    };

    // Store the new video (in real app, would send to server)
    const existingVideos = JSON.parse(
      localStorage.getItem("userVideos") || "[]",
    );
    existingVideos.push(finalVideoData);
    localStorage.setItem("userVideos", JSON.stringify(existingVideos));

    // Clear upload data
    localStorage.removeItem("pendingVideoUpload");

    // Navigate to watch the uploaded video
    navigate(`/watch/${videoId}`);
  };

  if (!uploadData) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          Upload Video
        </h1>

        {/* Video Player */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4">
            <video
              ref={videoRef}
              src={trimmedVideoUrl || videoUrl}
              className="w-full h-96 object-cover"
              onTimeUpdate={(e) =>
                setCurrentTime((e.target as HTMLVideoElement).currentTime)
              }
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
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
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
              <div className="bg-black/50 text-white text-sm px-2 py-1 rounded">
                {Math.floor(currentTime / 60)}:
                {Math.floor(currentTime % 60)
                  .toString()
                  .padStart(2, "0")}{" "}
                /{" "}
                {videoRef.current
                  ? Math.floor(videoRef.current.duration / 60)
                  : 0}
                :
                {videoRef.current
                  ? Math.floor(videoRef.current.duration % 60)
                      .toString()
                      .padStart(2, "0")
                  : "00"}
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" className="text-white">
                  <Volume2 className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white">
                  <Maximize className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Video Controls */}
          <div className="flex items-center justify-center space-x-6 mb-6">
            <Button
              variant={editMode === "trim" ? "default" : "outline"}
              onClick={editMode === "trim" ? cancelEdit : startTrimMode}
              disabled={isProcessing || trimmedVideoUrl}
              className={editMode === "trim" ? "bg-primary text-white" : ""}
            >
              {trimmedVideoUrl
                ? "Video Trimmed"
                : editMode === "trim"
                  ? "Cancel Trim"
                  : "Trim Video"}
            </Button>
            <Button
              variant={editMode === "split" ? "default" : "outline"}
              onClick={editMode === "split" ? cancelEdit : startSplitMode}
              disabled={isProcessing || trimmedVideoUrl}
              className={editMode === "split" ? "bg-primary text-white" : ""}
            >
              {editMode === "split" ? "Cancel Split" : "Split Video"}
            </Button>
            {editMode && (
              <Button
                onClick={applyEdit}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              >
                {isProcessing && editMode === "trim"
                  ? "Processing Trim..."
                  : "Apply Edit"}
              </Button>
            )}
            {!trimmedVideoUrl && (
              <Button variant="outline" disabled={isProcessing}>
                Video Speed
              </Button>
            )}
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>0</span>
              <span>10</span>
              <span>20</span>
              <span>30</span>
              <span>40</span>
              <span>50</span>
              <span>60</span>
              <span>70</span>
              <span>80</span>
              <span>90</span>
              <span>100</span>
            </div>

            {/* Timeline bar with thumbnails */}
            <div
              className="relative h-16 bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
              onClick={handleTimelineClick}
            >
              <div className="flex h-full">
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="flex-1 border-r border-gray-200">
                    <video
                      src={videoUrl}
                      className="w-full h-full object-cover pointer-events-none"
                      style={{ currentTime: (i / 10) * duration }}
                    />
                  </div>
                ))}
              </div>

              {/* Trim overlay */}
              {editMode === "trim" && (
                <>
                  {/* Dimmed areas outside trim range */}
                  <div
                    className="absolute top-0 bottom-0 bg-black bg-opacity-50"
                    style={{
                      left: 0,
                      width: `${(trimStart / duration) * 100}%`,
                    }}
                  />
                  <div
                    className="absolute top-0 bottom-0 bg-black bg-opacity-50"
                    style={{ left: `${(trimEnd / duration) * 100}%`, right: 0 }}
                  />

                  {/* Trim start handle */}
                  <div
                    className="absolute top-0 bottom-0 w-2 bg-green-500 cursor-ew-resize"
                    style={{ left: `${(trimStart / duration) * 100}%` }}
                  >
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-6 bg-green-500 rounded"></div>
                  </div>

                  {/* Trim end handle */}
                  <div
                    className="absolute top-0 bottom-0 w-2 bg-green-500 cursor-ew-resize"
                    style={{ left: `${(trimEnd / duration) * 100}%` }}
                  >
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-6 bg-green-500 rounded"></div>
                  </div>
                </>
              )}

              {/* Split point indicator */}
              {editMode === "split" && (
                <div
                  className="absolute top-0 bottom-0 w-1 bg-red-500"
                  style={{ left: `${(splitPoint / duration) * 100}%` }}
                >
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <Scissors className="h-4 w-4 text-red-500" />
                  </div>
                </div>
              )}

              {/* Current time indicator */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-primary z-10"
                style={{
                  left: `${duration ? (currentTime / duration) * 100 : 0}%`,
                }}
              >
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <div className="w-3 h-3 bg-primary rounded-full border-2 border-white"></div>
                </div>
              </div>
            </div>

            {/* Edit status and controls */}
            <div className="flex items-center justify-center space-x-4">
              {isProcessing && (
                <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded flex items-center">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                  Processing video trim...
                </div>
              )}
              {!isProcessing && trimmedVideoUrl && (
                <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded">
                  ✓ Video trimmed successfully! Duration:{" "}
                  {Math.floor(trimEnd - trimStart)}s
                </div>
              )}
              {!isProcessing && !trimmedVideoUrl && editMode === "trim" && (
                <div className="text-sm text-gray-600 bg-green-50 px-3 py-1 rounded">
                  Trim: {Math.floor(trimStart)}s - {Math.floor(trimEnd)}s (
                  {Math.floor(trimEnd - trimStart)}s duration)
                </div>
              )}
              {editMode === "split" && (
                <div className="text-sm text-gray-600 bg-red-50 px-3 py-1 rounded">
                  Split at: {Math.floor(splitPoint)}s
                </div>
              )}
              {!editMode && !trimmedVideoUrl && !isProcessing && (
                <div className="text-sm text-gray-600">
                  Click timeline to seek, or use Trim/Split buttons to edit
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Accessibility Settings */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Accessibility Settings
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">
                  High Contrast Mode
                </Label>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Text Size</Label>
              </div>
              <Select defaultValue="large">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large (18px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Font Style</Label>
              </div>
              <Select defaultValue="readable">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="readable">
                    Sans-serif (Readable)
                  </SelectItem>
                  <SelectItem value="dyslexic">Dyslexic Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">
                  Narration / Screen Reader
                </Label>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">
                  Simplified UI Mode
                </Label>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">
                  Audio Feedback for Actions
                </Label>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Button variant="outline" className="flex-1">
              ← Back
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handleUploadVideo}
            >
              Upload Video →
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
