import { Layout } from "@/components/Layout";
import { VideoCard } from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const videoSections = [
  {
    title: "Daily Routines",
    videos: [
      {
        id: 1,
        title: "Getting Ready for School",
        description:
          "Learn how to start your day with confidence - wake up, brush your teeth, and pack your bag.",
        thumbnail:
          "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=300&fit=crop",
        duration: "3:45",
      },
      {
        id: 2,
        title: "Morning Hygiene Steps",
        description:
          "Learn the essential steps of brushing, washing, and staying fresh before starting your school day properly.",
        thumbnail:
          "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop",
        duration: "2:30",
      },
      {
        id: 3,
        title: "Making Your Bed",
        description:
          "Discover how to straighten your blanket and pillows to keep your room neat every morning.",
        thumbnail:
          "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
        duration: "1:15",
      },
    ],
  },
  {
    title: "Understanding Emotions",
    videos: [
      {
        id: 4,
        title: "Recognizing Feelings",
        description:
          "Explore different facial expressions and body language to understand how emotions like happy, sad and angry.",
        thumbnail:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop",
        duration: "4:20",
      },
      {
        id: 5,
        title: "Calming Techniques",
        description:
          "Learn easy breathing and stretching routines to stay calm when you feel anxious, upset, or stressed.",
        thumbnail:
          "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop",
        duration: "5:10",
      },
      {
        id: 6,
        title: "Talking About Emotions",
        description:
          "Practice simple ways to express feelings using words, colors, or hand signals in everyday situations.",
        thumbnail:
          "https://images.unsplash.com/photo-1574169208507-84376144848b?w=400&h=300&fit=crop",
        duration: "3:55",
      },
    ],
  },
];

export default function Index() {
  const navigate = useNavigate();
  const [userVideos, setUserVideos] = useState<any[]>([]);

  useEffect(() => {
    // Load user videos from localStorage
    const storedVideos = localStorage.getItem("userVideos");
    if (storedVideos) {
      const videos = JSON.parse(storedVideos);
      setUserVideos(videos.slice(0, 6)); // Show only first 6 user videos
    }
  }, []);

  const handleVideoClick = (videoId: number | string) => {
    navigate(`/watch/${videoId}`);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Watch Videos</h1>
        </div>

        <div className="space-y-8">
          {videoSections.map((section) => (
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
        </div>
      </div>
    </Layout>
  );
}
