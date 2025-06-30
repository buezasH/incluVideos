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

  const handleTagRemove = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setUploadedFile(file);
    } else if (file) {
      alert('Please select a video file (.mp4, .avi, .mov, .wmv)');
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      setUploadedFile(file);
    } else if (file) {
      alert('Please drop a video file (.mp4, .avi, .mov, .wmv)');
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
      alert('Please upload a video file first');
      return;
    }

    if (!videoTitle.trim()) {
      alert('Please enter a video title');
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
      uploadedAt: new Date().toISOString()
    };

    localStorage.setItem('pendingVideoUpload', JSON.stringify({
      ...uploadData,
      file: null, // Can't stringify File object
      fileName: uploadedFile.name,
      fileSize: uploadedFile.size,
      fileType: uploadedFile.type
    }));

    // Navigate to edit page
    navigate('/edit');
  };

  return (
    <Layout>
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6 lg:mb-8">
            Upload Video
          </h1>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Upload Area */}
            <div className="xl:col-span-2">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                uploadedFile
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 bg-gray-50 hover:border-primary hover:bg-primary/5'
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
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-lg flex items-center justify-center">
                    <Upload className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-green-700 font-medium mb-2">
                    Video uploaded successfully!
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    {uploadedFile.name} ({(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleBrowseClick}
                    className="border-primary text-primary hover:bg-primary hover:text-white"
                  >
                    Change File
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-lg flex items-center justify-center">
                    <Upload className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium">Drag & drop</span> your video here
                    or <span className="font-medium text-primary">click</span> to
                    upload.
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    (.mp4, .avi, .mov, .wmv - Max 500 MB)
                  </p>
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={handleBrowseClick}
                  >
                    Browse File
                  </Button>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="mt-8 space-y-6">
              <div>
                <Label htmlFor="title">Video Title</Label>
                <Input
                  id="title"
                  placeholder="Write video title..."
                  className="mt-2"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Video Description</Label>
                <Textarea
                  id="description"
                  placeholder="Write video Description..."
                  className="mt-2 min-h-[100px]"
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                />
              </div>

              <div>
                <Label>Video Tags</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedTags.map((tag) => {
                    const tagConfig = predefinedTags.find(
                      (t) => t.label === tag,
                    );
                    return (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className={`${tagConfig?.color} flex items-center gap-1`}
                      >
                        {tag}
                        <button onClick={() => handleTagRemove(tag)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                  <Button variant="outline" size="sm">
                    Add Tag
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="life-skills">Life Skills</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="entertainment">
                        Entertainment
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Language</Label>
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
                <Label>Visibility</Label>
                <RadioGroup
                  value={visibility}
                  onValueChange={setVisibility}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="public" />
                    <Label htmlFor="public">Public</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="private">Private</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unlisted" id="unlisted" />
                    <Label htmlFor="unlisted">Unlisted</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>
                  Back
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
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
    </Layout>
  );
}