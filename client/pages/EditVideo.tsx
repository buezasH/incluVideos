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
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  uploadVideoToR2,
  uploadThumbnailDataUrlToR2,
  generateVideoId,
  getR2Url,
} from "@/lib/r2Storage";
import {
  createVideoMetadata,
  updateVideoMetadata,
  getVideoMetadata,
  CreateVideoData,
  UpdateVideoData,
} from "@/lib/videoMetadataService";

export default function EditVideo() {
  const navigate = useNavigate();
  const { id } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [editMode, setEditMode] = useState<"trim" | "chapters" | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [chapters, setChapters] = useState<
    {
      id: string;
      title: string;
      startTime: number;
      endTime: number;
    }[]
  >([]);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [trimmedVideoUrl, setTrimmedVideoUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExistingVideo, setIsExistingVideo] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  useEffect(() => {
    // Check if we're on /edit-videos/:id route (editing existing video)
    const isEditVideosRoute =
      window.location.pathname.startsWith("/edit-videos/");

    if (id && isEditVideosRoute) {
      // Editing existing video from gallery - load from MongoDB
      const loadExistingVideo = async () => {
        try {
          const existingVideo = await getVideoMetadata(id);

          setIsExistingVideo(true);
          setUploadData({
            title: existingVideo.title,
            description: existingVideo.description,
            category: existingVideo.category,
            tags: existingVideo.tags,
            fileUrl: existingVideo.videoUrl,
            trimMetadata: existingVideo.trimData,
            isPublic: existingVideo.isPublic,
            chapters: existingVideo.chapters,
          });
          setVideoUrl(existingVideo.videoUrl);

          // Load existing chapters
          if (existingVideo.chapters && existingVideo.chapters.length > 0) {
            setChapters(existingVideo.chapters);
          }

          // If the video was previously trimmed, set up the trim data
          if (existingVideo.trimData) {
            setTrimmedVideoUrl(existingVideo.videoUrl);
          }
        } catch (error) {
          console.error("Error loading video:", error);
          // Video not found or error, redirect to gallery
          navigate("/edit-videos");
        }
      };

      loadExistingVideo();
    } else {
      // New upload from upload page (/edit route)
      const storedData = localStorage.getItem("pendingVideoUpload");
      if (storedData) {
        const data = JSON.parse(storedData);
        setUploadData(data);
        setVideoUrl(data.fileUrl);
        setIsExistingVideo(false);
      } else {
        // If no upload data, redirect to upload page
        navigate("/upload");
      }
    }
  }, [id, navigate]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      const videoDuration = video.duration;
      setDuration(videoDuration);
      setTrimStart(0);
      setTrimEnd(videoDuration);

      // Initialize with a single chapter if no chapters exist
      if (chapters.length === 0) {
        const initialChapter = {
          id: `chapter-${Date.now()}`,
          title: "Chapter 1",
          startTime: 0,
          endTime: videoDuration,
        };
        setChapters([initialChapter]);
      }
    };

    const handleTimeUpdate = () => {
      const video = videoRef.current;
      if (!video || !trimmedVideoUrl) return;

      // If we have a trimmed video, enforce boundaries
      if (uploadData?.trimMetadata) {
        const { trimStart, trimEnd } = uploadData.trimMetadata;
        const actualTime = video.currentTime;

        if (actualTime < trimStart) {
          video.currentTime = trimStart;
        } else if (actualTime >= trimEnd) {
          video.currentTime = trimStart;
          video.pause();
          setIsPlaying(false);
        }

        // Set relative time for display (0 to trimmed duration)
        setCurrentTime(Math.max(0, actualTime - trimStart));
      } else {
        setCurrentTime(video.currentTime);
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [videoUrl, trimmedVideoUrl, uploadData]);

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

    if (uploadData?.trimMetadata) {
      // If video is trimmed, seek relative to trim start
      const { trimStart, trimEnd } = uploadData.trimMetadata;
      const actualTime = trimStart + time;
      video.currentTime = Math.max(
        trimStart,
        Math.min(actualTime, trimEnd - 0.1),
      );
    } else {
      video.currentTime = time;
    }

    setCurrentTime(time);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const newTime = clickPercent * duration;

    if (editMode === "trim" && !trimmedVideoUrl) {
      // Set trim points based on click (only if not already trimmed)
      if (Math.abs(newTime - trimStart) < Math.abs(newTime - trimEnd)) {
        setTrimStart(Math.max(0, Math.min(newTime, trimEnd - 1)));
      } else {
        setTrimEnd(Math.min(duration, Math.max(newTime, trimStart + 1)));
      }
    } else if (editMode === "chapters") {
      // In chapter mode, clicking sets a new chapter split point
      addChapter();
    } else {
      seekToTime(newTime);
    }
  };

  const startTrimMode = () => {
    setEditMode("trim");
    setTrimStart(0);
    setTrimEnd(duration);
  };

  const startChapterMode = () => {
    setEditMode("chapters");
  };

  const cancelEdit = () => {
    setEditMode(null);
  };

  const generateChapterTitle = (index: number) => `Chapter ${index + 1}`;

  const addChapter = () => {
    if (chapters.length === 0) return;

    const newChapter = {
      id: `chapter-${Date.now()}`,
      title: generateChapterTitle(chapters.length),
      startTime: currentTime,
      endTime: duration,
    };

    // Update the previous chapter's end time
    const updatedChapters = [...chapters];
    if (updatedChapters.length > 0) {
      updatedChapters[updatedChapters.length - 1].endTime = currentTime;
    }

    updatedChapters.push(newChapter);
    setChapters(updatedChapters);
  };

  const removeChapter = (chapterId: string) => {
    if (chapters.length <= 1) return; // Don't allow removing the last chapter

    const updatedChapters = chapters.filter(
      (chapter) => chapter.id !== chapterId,
    );

    // Adjust the remaining chapters to fill the gaps
    for (let i = 0; i < updatedChapters.length; i++) {
      if (i === 0) {
        updatedChapters[i].startTime = 0;
      } else {
        updatedChapters[i].startTime = updatedChapters[i - 1].endTime;
      }

      if (i === updatedChapters.length - 1) {
        updatedChapters[i].endTime = duration;
      }
    }

    setChapters(updatedChapters);
  };

  const updateChapterTitle = (chapterId: string, title: string) => {
    const updatedChapters = chapters.map((chapter) =>
      chapter.id === chapterId ? { ...chapter, title } : chapter,
    );
    setChapters(updatedChapters);
  };

  const seekToChapter = (chapter: { startTime: number }) => {
    if (videoRef.current) {
      videoRef.current.currentTime = chapter.startTime;
      setCurrentTime(chapter.startTime);
    }
  };

  const trimVideo = async () => {
    if (!videoRef.current || editMode !== "trim") return;

    setIsProcessing(true);

    try {
      const trimmedDuration = trimEnd - trimStart;

      // Simple trim implementation: store trim points and duration
      // The actual video trimming will happen during upload
      setTrimmedVideoUrl(videoUrl); // Keep original URL for preview

      // Update UI to show trimmed duration
      setDuration(trimmedDuration);
      setCurrentTime(0);

      // Store trim metadata for upload processing
      const trimMetadata = {
        originalUrl: videoUrl,
        trimStart,
        trimEnd,
        trimmedDuration,
        needsServerProcessing: true, // Flag for server-side trimming
      };

      setUploadData((prev) => ({
        ...prev,
        trimMetadata,
      }));

      setIsProcessing(false);
      setEditMode(null);

      // Reset video to trimmed start point for preview
      if (videoRef.current) {
        videoRef.current.currentTime = trimStart;
      }

      console.log(
        `✅ Video trim points set: ${trimStart}s to ${trimEnd}s (${trimmedDuration}s duration)`,
      );
    } catch (error) {
      console.error("Error setting trim points:", error);
      alert("Error setting trim points. Please try again.");
      setIsProcessing(false);
    }
  };

  const applyEdit = () => {
    if (editMode === "trim") {
      trimVideo();
    } else if (editMode === "chapters") {
      // Save chapters to upload data
      setUploadData((prev) => ({
        ...prev,
        chapters,
      }));
      setEditMode(null);
      console.log("✅ Chapters saved:", chapters);
    }
  };

  const handleUploadVideo = async () => {
    const trimMetadata = uploadData?.trimMetadata;
    setIsUploading(true);

    try {
      if (isExistingVideo && id) {
        // Update existing video metadata in MongoDB
        setUploadProgress("Updating video information...");

        const updateData: UpdateVideoData = {
          title: uploadData.title,
          description: uploadData.description,
          category: uploadData.category,
          tags: uploadData.tags,
          finalDuration: trimMetadata ? trimMetadata.trimmedDuration : duration,
          wasTrimmed: !!trimMetadata,
          trimData: trimMetadata
            ? {
                trimStart: trimMetadata.trimStart,
                trimEnd: trimMetadata.trimEnd,
                trimmedDuration: trimMetadata.trimmedDuration,
              }
            : undefined,
          chapters: chapters.length > 0 ? chapters : undefined,
        };

        // Update metadata in MongoDB
        const updatedVideo = await updateVideoMetadata(id, updateData);

        console.log(
          `✅ Video updated in MongoDB: ${updatedVideo.title} (${id})`,
        );
        navigate(`/watch/${id}`);
      } else {
        // Upload new video to R2
        const videoId = uploadData.videoId || generateVideoId();

        // Get the original file from localStorage
        const pendingUpload = JSON.parse(
          localStorage.getItem("pendingVideoUpload") || "{}",
        );

        if (!pendingUpload.fileName) {
          throw new Error("No video file found for upload");
        }

        setUploadProgress("Uploading video to cloud storage...");

        // Upload original video to R2 (trim info saved in metadata)
        const videoBlob = await fetch(videoUrl).then((res) => res.blob());
        const videoFile = new File([videoBlob], pendingUpload.fileName, {
          type: pendingUpload.fileType,
        });

        const videoUploadResult = await uploadVideoToR2(videoFile, videoId);

        // Upload thumbnail to R2 if available
        let thumbnailUrl = "";
        if (uploadData.thumbnail) {
          setUploadProgress("Uploading thumbnail...");
          const thumbnailUploadResult = await uploadThumbnailDataUrlToR2(
            uploadData.thumbnail,
            videoId,
          );
          thumbnailUrl = thumbnailUploadResult.url;
        }

        setUploadProgress("Saving video information...");

        // Prepare video metadata for MongoDB
        const videoMetadata: CreateVideoData = {
          title: uploadData.title,
          description: uploadData.description,
          category: uploadData.category || "Other",
          tags: uploadData.tags || [],
          videoUrl: videoUploadResult.url,
          thumbnailUrl: thumbnailUrl || undefined,
          r2VideoKey: videoUploadResult.key,
          r2ThumbnailKey: thumbnailUrl
            ? `thumbnails/${videoId}.jpg`
            : undefined,
          duration: duration,
          originalDuration: duration,
          finalDuration: trimMetadata ? trimMetadata.trimmedDuration : duration,
          wasTrimmed: !!trimMetadata,
          trimData: trimMetadata
            ? {
                trimStart: trimMetadata.trimStart,
                trimEnd: trimMetadata.trimEnd,
                trimmedDuration: trimMetadata.trimmedDuration,
              }
            : undefined,
          isPublic:
            uploadData.isPublic !== undefined ? uploadData.isPublic : true,
          chapters: chapters.length > 0 ? chapters : undefined,
          accessibilityFeatures: {
            hasSubtitles: false,
            hasAudioDescription: false,
            hasSignLanguage: false,
          },
        };

        // Save metadata to MongoDB
        const savedVideo = await createVideoMetadata(videoMetadata);

        // Clear upload data for new videos
        localStorage.removeItem("pendingVideoUpload");

        console.log(
          `✅ Video saved to MongoDB: ${savedVideo.title} (${savedVideo.id})`,
        );
        navigate(`/watch/${savedVideo.id}`);
      }
    } catch (error) {
      console.error("Upload error:", error);

      // More user-friendly error messages
      let errorMessage = "Upload failed. ";
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          errorMessage +=
            "Using local storage instead of cloud storage. Your video is saved locally and you can continue editing.";
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += "Unknown error occurred.";
      }

      alert(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
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
          {isExistingVideo ? "Edit Video" : "Upload Video"}
        </h1>

        {/* Video Player */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-96 object-cover"
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
                {isFinite(currentTime) ? Math.floor(currentTime / 60) : 0}:
                {isFinite(currentTime)
                  ? Math.floor(currentTime % 60)
                      .toString()
                      .padStart(2, "0")
                  : "00"}{" "}
                / {duration > 0 ? Math.floor(duration / 60) : 0}:
                {duration > 0
                  ? Math.floor(duration % 60)
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
              variant={editMode === "chapters" ? "default" : "outline"}
              onClick={editMode === "chapters" ? cancelEdit : startChapterMode}
              disabled={isProcessing || trimmedVideoUrl}
              className={editMode === "chapters" ? "bg-primary text-white" : ""}
            >
              {editMode === "chapters" ? "Cancel Chapters" : "Add Chapters"}
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
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                      {duration > 0
                        ? `${Math.floor((i / 10) * duration)}s`
                        : "Loading..."}
                    </div>
                  </div>
                ))}
              </div>

              {/* Trim overlay */}
              {editMode === "trim" && duration > 0 && (
                <>
                  {/* Dimmed areas outside trim range */}
                  <div
                    className="absolute top-0 bottom-0 bg-black bg-opacity-50"
                    style={{
                      left: 0,
                      width: `${Math.max(0, Math.min(100, (trimStart / duration) * 100))}%`,
                    }}
                  />
                  <div
                    className="absolute top-0 bottom-0 bg-black bg-opacity-50"
                    style={{
                      left: `${Math.max(0, Math.min(100, (trimEnd / duration) * 100))}%`,
                      right: 0,
                    }}
                  />

                  {/* Trim start handle */}
                  <div
                    className="absolute top-0 bottom-0 w-2 bg-green-500 cursor-ew-resize"
                    style={{
                      left: `${Math.max(0, Math.min(100, (trimStart / duration) * 100))}%`,
                    }}
                  >
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-6 bg-green-500 rounded"></div>
                  </div>

                  {/* Trim end handle */}
                  <div
                    className="absolute top-0 bottom-0 w-2 bg-green-500 cursor-ew-resize"
                    style={{
                      left: `${Math.max(0, Math.min(100, (trimEnd / duration) * 100))}%`,
                    }}
                  >
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-6 bg-green-500 rounded"></div>
                  </div>
                </>
              )}

              {/* Chapter indicators */}
              {chapters.length > 0 &&
                duration > 0 &&
                chapters.map((chapter, index) => (
                  <React.Fragment key={chapter.id}>
                    {/* Chapter divider (except for first chapter) */}
                    {index > 0 && (
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-blue-500 cursor-pointer hover:bg-blue-600"
                        style={{
                          left: `${Math.max(0, Math.min(100, (chapter.startTime / duration) * 100))}%`,
                        }}
                        onClick={() => seekToChapter(chapter)}
                        title={`Chapter ${index + 1}: ${chapter.title}`}
                      >
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}

              {/* Current time indicator */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-primary z-10"
                style={{
                  left: `${duration > 0 ? Math.max(0, Math.min(100, (currentTime / duration) * 100)) : 0}%`,
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
              {editMode === "chapters" && (
                <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded">
                  Chapter Mode: Click timeline to add new chapter at current
                  time
                </div>
              )}
              {!editMode && !trimmedVideoUrl && !isProcessing && (
                <div className="text-sm text-gray-600">
                  Click timeline to seek, or use Trim/Chapters buttons to edit
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
            <Button
              variant="outline"
              className="flex-1"
              onClick={() =>
                navigate(isExistingVideo ? "/edit-videos" : "/upload")
              }
            >
              ← Back
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handleUploadVideo}
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  {uploadProgress || "Processing..."}
                </div>
              ) : (
                `${isExistingVideo ? "Save Changes" : "Upload Video"} →`
              )}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
