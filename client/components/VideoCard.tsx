import { Play, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  title: string;
  description: string;
  thumbnail: string;
  duration?: string;
  className?: string;
  onClick?: () => void;
}

export function VideoCard({
  title,
  description,
  thumbnail,
  duration,
  className,
  onClick,
}: VideoCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition-shadow cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      <div className="relative">
        <img src={thumbnail} alt={title} className="w-full h-48 object-cover" />
        <div
          className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center"
          style={{
            backgroundImage:
              "url(https://cdn.builder.io/api/v1/image/assets%2Fc17e835299d843818fd55ba7cc68e657%2Fce9568adc00341efa8425eeea4a6fd75)",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <Play className="h-12 w-12 text-white opacity-0 hover:opacity-100 transition-opacity" />
        </div>
        {duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {duration}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 line-clamp-2">{title}</h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {description}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="ml-2">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
