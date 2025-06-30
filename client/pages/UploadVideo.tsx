import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, X } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { generateVideoThumbnailWithSize } from "@/lib/videoUtils";

const predefinedTags = [
  { label: "Safety", color: "bg-green-100 text-green-800" },
  { label: "Outdoors", color: "bg-blue-100 text-blue-800" },
  { label: "Routine", color: "bg-purple-100 text-purple-800" },
];

export default function UploadVideo() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "Safety",
    "Outdoors",
    "Routine",
  ]);
  const [visibility, setVisibility] = useState("public");
  const [category, setCategory] = useState("life-skills");
  const [language, setLanguage] = useState("english");
  const [thumbnail, setThumbnail] = useState<string>("");
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);

  const handleTagRemove = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setUploadedFile(file);
      await generateThumbnail(file);
    } else if (file) {
      alert("Please select a video file (.mp4, .avi, .mov, .wmv)");
    }
  };

  const generateThumbnail = async (file: File) => {
    setIsGeneratingThumbnail(true);
    try {
      const thumbnailDataUrl = await generateVideoThumbnailWithSize(
        file,
        400,
        300,
        2,
      );
      setThumbnail(thumbnailDataUrl);
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      // Fallback to a placeholder or keep empty
      setThumbnail("");
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      setUploadedFile(file);
      await generateThumbnail(file);
    } else if (file) {
      alert("Please drop a video file (.mp4, .avi, .mov, .wmv)");
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleContinue = () => {
    if (!uploadedFile) {
      alert("Please upload a video file first");
      return;
    }

    if (!videoTitle.trim()) {
      alert("Please enter a video title");
      return;
    }

    // Store upload data in localStorage for the edit page
    const uploadData = {
      file: uploadedFile,
      fileUrl: URL.createObjectURL(uploadedFile),
      title: videoTitle,
      description: videoDescription,
      tags: selectedTags,
      category,
      language,
      visibility,
      thumbnail: thumbnail,
      uploadedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "pendingVideoUpload",
      JSON.stringify({
        ...uploadData,
        file: null, // Can't stringify File object
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        fileType: uploadedFile.type,
      }),
    );

    // Navigate to edit page for new upload
    navigate("/edit");
  };

  return (
    <Layout>
      <div className="flex-1 overflow-auto">
        <div className="min-h-full p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6 lg:mb-8">
              Upload Video
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 min-h-[600px]">
              {/* Upload Area - Takes more space on larger screens */}
              <div className="lg:col-span-8 xl:col-span-7 flex flex-col">
                <div
                  className={`border-2 border-dashed rounded-lg p-6 sm:p-8 lg:p-12 text-center transition-colors flex-1 min-h-[350px] sm:min-h-[400px] lg:min-h-[500px] flex flex-col justify-center ${
                    uploadedFile
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 bg-gray-50 hover:border-primary hover:bg-primary/5"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {uploadedFile ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-green-100 rounded-lg flex items-center justify-center">
                        <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
                      </div>
                      <div>
                        <p className="text-green-700 font-medium mb-2 text-base sm:text-lg">
                          Video uploaded successfully!
                        </p>
                        <p className="text-sm sm:text-base text-gray-600 mb-4 break-all">
                          {uploadedFile.name} (
                          {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleBrowseClick}
                        className="border-primary text-primary hover:bg-primary hover:text-white text-sm sm:text-base px-6 py-2"
                      >
                        Change File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-green-100 rounded-lg flex items-center justify-center">
                        <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
                      </div>
                      <div>
                        <p className="text-gray-600 mb-2 text-base sm:text-lg">
                          <span className="font-medium">Drag & drop</span> your
                          video here or{" "}
                          <span className="font-medium text-primary">
                            click
                          </span>{" "}
                          to upload.
                        </p>
                        <p className="text-sm sm:text-base text-gray-500 mb-4">
                          (.mp4, .avi, .mov, .wmv - Max 500 MB)
                        </p>
                      </div>
                      <Button
                        className="bg-primary hover:bg-primary/90 text-sm sm:text-base px-8 py-3"
                        onClick={handleBrowseClick}
                      >
                        Browse File
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Fields - Sidebar on large screens, full width on mobile */}
              <div className="lg:col-span-4 xl:col-span-5">
                <div className="bg-white rounded-lg border p-6 lg:p-8 h-full">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="title" className="text-base font-medium">
                        Video Title
                      </Label>
                      <Input
                        id="title"
                        placeholder="Write video title..."
                        className="mt-2 text-base"
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="description"
                        className="text-base font-medium"
                      >
                        Video Description
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Write video Description..."
                        className="mt-2 min-h-[120px] text-base"
                        value={videoDescription}
                        onChange={(e) => setVideoDescription(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label className="text-base font-medium">
                        Video Tags
                      </Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedTags.map((tag) => {
                          const tagConfig = predefinedTags.find(
                            (t) => t.label === tag,
                          );
                          return (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className={`${tagConfig?.color} flex items-center gap-1 text-sm`}
                            >
                              {tag}
                              <button onClick={() => handleTagRemove(tag)}>
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                        <Button variant="outline" size="sm" className="text-sm">
                          Add Tag
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-base font-medium">
                          Category
                        </Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="life-skills">
                              Life Skills
                            </SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="entertainment">
                              Entertainment
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-base font-medium">
                          Language
                        </Label>
                        <Select value={language} onValueChange={setLanguage}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="english">English</SelectItem>
                            <SelectItem value="spanish">Spanish</SelectItem>
                            <SelectItem value="french">French</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-medium">
                        Visibility
                      </Label>
                      <RadioGroup
                        value={visibility}
                        onValueChange={setVisibility}
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="public" id="public" />
                          <Label htmlFor="public" className="text-sm">
                            Public
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="private" id="private" />
                          <Label htmlFor="private" className="text-sm">
                            Private
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="unlisted" id="unlisted" />
                          <Label htmlFor="unlisted" className="text-sm">
                            Unlisted
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button
                        variant="outline"
                        className="flex-1 text-base py-3"
                        onClick={() => navigate("/")}
                      >
                        Back
                      </Button>
                      <Button
                        className="flex-1 bg-primary hover:bg-primary/90 text-base py-3"
                        onClick={handleContinue}
                        disabled={!uploadedFile || !videoTitle.trim()}
                      >
                        Continue →
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
