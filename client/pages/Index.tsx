import { Layout } from "@/components/Layout";
import { VideoCard } from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getVideos } from "@/lib/videoMetadataService";
import type { VideoMetadata } from "@/lib/videoMetadataService";

// Removed sample video sections - only show real videos from MongoDB

export default function Index() {
  const navigate = useNavigate();
  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [mongoVideos, setMongoVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Load user videos from localStorage
    const storedVideos = localStorage.getItem("userVideos");
    if (storedVideos) {
      const videos = JSON.parse(storedVideos);
      setUserVideos(videos.slice(0, 6)); // Show only first 6 user videos
    }

    // Load videos from MongoDB
    const loadMongoVideos = async () => {
      try {
        console.log("🔍 Fetching videos from MongoDB...");

        const response = await getVideos({
          limit: 20, // Get up to 20 videos
          page: 1,
        });

        console.log("✅ Videos loaded:", response.videos.length);
        setMongoVideos(response.videos);
        setError("");
      } catch (error: any) {
        console.error("❌ Error loading videos:", error);
        setError(
          "Unable to load videos at the moment. Please try again later.",
        );
        setMongoVideos([]);
      } finally {
        setLoading(false);
      }
    };

    loadMongoVideos();
  }, []);

  const handleVideoClick = (videoId: number | string) => {
    navigate(`/watch/${videoId}`);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Function to get thumbnail URL for MongoDB videos
  const getVideoThumbnail = (video: VideoMetadata) => {
    // Use the real thumbnail from the video metadata
    if (video.thumbnailUrl) {
      return video.thumbnailUrl;
    }

    // If no thumbnail, try to generate one from video URL or use a minimal fallback
    console.log(`⚠️ No thumbnail found for video: ${video.title}`);
    return "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=300&fit=crop";
  };

  // Function to categorize MongoDB videos into sections
  const createVideoSections = () => {
    if (mongoVideos.length === 0) {
      return []; // Return empty array when no videos
    }

    const sections = [
      {
        title: "Daily Routines",
        videos: mongoVideos
          .filter(
            (video) =>
              video.category === "daily-living" ||
              video.tags.some((tag) =>
                [
                  "routine",
                  "daily",
                  "morning",
                  "hygiene",
                  "breakfast",
                ].includes(tag.toLowerCase()),
              ),
          )
          .slice(0, 6)
          .map((video) => ({
            id: video.id,
            title: video.title,
            description: video.description,
            thumbnail: getVideoThumbnail(video),
            duration: formatDuration(video.finalDuration),
          })),
      },
      {
        title: "Understanding Emotions",
        videos: mongoVideos
          .filter(
            (video) =>
              video.category === "social-skills" ||
              video.tags.some((tag) =>
                ["emotion", "feelings", "social", "communication"].includes(
                  tag.toLowerCase(),
                ),
              ),
          )
          .slice(0, 6)
          .map((video) => ({
            id: video.id,
            title: video.title,
            description: video.description,
            thumbnail: getVideoThumbnail(video),
            duration: formatDuration(video.finalDuration),
          })),
      },
    ];

    // If we don't have enough videos in specific categories, add a general section
    const remainingVideos = mongoVideos
      .filter(
        (video) =>
          !sections.some((section) =>
            section.videos.some((v) => v.id === video.id),
          ),
      )
      .slice(0, 6)
      .map((video) => ({
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnail: getVideoThumbnail(video),
        duration: formatDuration(video.finalDuration),
      }));

    if (remainingVideos.length > 0) {
      sections.push({
        title: "All Videos",
        videos: remainingVideos,
      });
    }

    // Return only sections that have videos
    return sections.filter((section) => section.videos.length > 0);
  };

  const dynamicVideoSections = createVideoSections();

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Watch Videos</h1>
          {loading && (
            <div className="text-sm text-gray-500 flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
              Loading videos...
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800 text-sm">⚠️ {error}</div>
          </div>
        )}

        <div className="space-y-8">
          {/* User Videos Section */}
          {userVideos.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Your Videos
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/edit-videos")}
                >
                  View all
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    title={video.title}
                    description={video.description}
                    thumbnail={video.thumbnail}
                    duration={formatDuration(video.finalDuration)}
                    onClick={() => handleVideoClick(video.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Video Sections (MongoDB or Sample) */}
          {dynamicVideoSections.map((section) => (
            <div key={section.title}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {section.title}
                </h2>
                <Button variant="outline" size="sm">
                  View all
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    title={video.title}
                    description={video.description}
                    thumbnail={video.thumbnail}
                    duration={video.duration}
                    onClick={() => handleVideoClick(video.id)}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Empty State */}
          {!loading && mongoVideos.length === 0 && userVideos.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                No videos available yet. Upload your first video to get started!
              </div>
              <Button onClick={() => navigate("/upload")}>Upload Video</Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
