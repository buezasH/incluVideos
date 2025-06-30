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

  const applyEdit = () => {
    if (editMode === "trim") {
      alert(
        `Trimming video from ${Math.floor(trimStart)}s to ${Math.floor(trimEnd)}s`,
      );
    } else if (editMode === "split") {
      alert(`Splitting video at ${Math.floor(splitPoint)}s`);
    }
    setEditMode(null);
  };

  const handleUploadVideo = () => {
    // Clear the upload data and navigate to success page or video library
    localStorage.removeItem("pendingVideoUpload");
    alert("Video uploaded successfully!");
    navigate("/");
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
              src={videoUrl}
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
              className={editMode === "trim" ? "bg-primary text-white" : ""}
            >
              {editMode === "trim" ? "Cancel Trim" : "Trim Video"}
            </Button>
            <Button
              variant={editMode === "split" ? "default" : "outline"}
              onClick={editMode === "split" ? cancelEdit : startSplitMode}
              className={editMode === "split" ? "bg-primary text-white" : ""}
            >
              {editMode === "split" ? "Cancel Split" : "Split Video"}
            </Button>
            {editMode && (
              <Button
                onClick={applyEdit}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Apply Edit
              </Button>
            )}
            <Button variant="outline">Video Speed</Button>
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
            <div className="relative h-16 bg-gray-100 rounded-lg overflow-hidden">
              <div className="flex h-full">
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="flex-1 border-r border-gray-200">
                    <img
                      src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=60&fit=crop"
                      alt={`Frame ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              {/* Current time indicator */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-primary"
                style={{ left: `${currentTime}%` }}
              >
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <Scissors className="h-4 w-4 text-primary" />
                </div>
              </div>
            </div>

            {/* Split controls */}
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                className="bg-gray-100 text-gray-600 border-gray-300"
              >
                00:30:00
              </Button>
              <Button className="bg-primary hover:bg-primary/90">
                <Scissors className="h-4 w-4 mr-2" />
                Split
              </Button>
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
            <Button className="flex-1 bg-primary hover:bg-primary/90">
              Upload Video →
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
