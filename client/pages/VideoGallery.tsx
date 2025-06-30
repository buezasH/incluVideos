import { Layout } from "@/components/Layout";
import { VideoCard } from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Upload, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface UserVideo {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  author: {
    name: string;
    avatar: string;
    title: string;
    videoCount: number;
  };
  uploadedAt: string;
  originalDuration: number;
  finalDuration: number;
  wasTrimmed: boolean;
  trimData: any;
}

export default function VideoGallery() {
  const navigate = useNavigate();
  const [userVideos, setUserVideos] = useState<UserVideo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVideos, setFilteredVideos] = useState<UserVideo[]>([]);

  useEffect(() => {
    // Load user videos from localStorage
    const storedVideos = localStorage.getItem("userVideos");
    if (storedVideos) {
      const videos = JSON.parse(storedVideos);
      setUserVideos(videos);
      setFilteredVideos(videos);
    }
  }, []);

  useEffect(() => {
    // Filter videos based on search query
    if (searchQuery.trim() === "") {
      setFilteredVideos(userVideos);
    } else {
      const filtered = userVideos.filter(
        (video) =>
          video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          video.description.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredVideos(filtered);
    }
  }, [searchQuery, userVideos]);

  const handleEditVideo = (videoId: number) => {
    navigate(`/edit-videos/${videoId}`);
  };

  const handleUploadNew = () => {
    navigate("/upload");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <Layout>
      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 lg:mb-8">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  Edit Videos
                </h1>
                <p className="text-gray-600">
                  Select a video to edit or upload a new one
                </p>
              </div>
              <Button
                onClick={handleUploadNew}
                className="bg-primary hover:bg-primary/90 flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload New Video
              </Button>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>

            {/* Videos Grid */}
            {filteredVideos.length === 0 ? (
              <div className="text-center py-12">
                {userVideos.length === 0 ? (
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No videos uploaded yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Start by uploading your first video to begin editing
                    </p>
                    <Button
                      onClick={handleUploadNew}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Upload Your First Video
                    </Button>
                  </div>
                ) : (
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No videos found
                    </h3>
                    <p className="text-gray-600">
                      Try adjusting your search terms
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVideos.map((video) => (
                  <div key={video.id} className="group relative">
                    <div
                      className="bg-white rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition-all cursor-pointer"
                      onClick={() => handleEditVideo(video.id)}
                    >
                      <div className="relative">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                          <Button
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-white bg-black/50 hover:bg-black/70"
                          >
                            Edit Video
                          </Button>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(video.finalDuration)}
                        </div>
                        {video.wasTrimmed && (
                          <div className="absolute top-2 left-2">
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-800 text-xs"
                            >
                              Edited
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                          {video.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {video.description}
                        </p>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>Uploaded {formatDate(video.uploadedAt)}</span>
                          {video.wasTrimmed && (
                            <span className="text-green-600 font-medium">
                              Trimmed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stats */}
            {userVideos.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                  <span>
                    <strong className="text-gray-900">
                      {userVideos.length}
                    </strong>{" "}
                    video{userVideos.length !== 1 ? "s" : ""} total
                  </span>
                  <span>
                    <strong className="text-gray-900">
                      {userVideos.filter((v) => v.wasTrimmed).length}
                    </strong>{" "}
                    edited
                  </span>
                  <span>
                    <strong className="text-gray-900">
                      {filteredVideos.length}
                    </strong>{" "}
                    showing
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
