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
import { useState } from "react";

export default function EditVideo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(30);
  const [splitTime, setSplitTime] = useState(30);

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          Upload Video
        </h1>

        {/* Video Player */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4">
            <img
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=450&fit=crop"
              alt="Video preview"
              className="w-full h-96 object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-16 w-16 bg-white/20 hover:bg-white/30 text-white"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8" />
                )}
              </Button>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/50 text-white text-sm px-2 py-1 rounded">
                0:05 / 02:25
              </div>
            </div>
            <div className="absolute bottom-4 right-4 flex space-x-2">
              <Button variant="ghost" size="icon" className="text-white">
                <Volume2 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white">
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Video Controls */}
          <div className="flex items-center justify-center space-x-6 mb-6">
            <Button variant="outline">Trim Video</Button>
            <Button variant="outline">Split Video</Button>
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
