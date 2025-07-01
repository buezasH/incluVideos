import { useState, useEffect } from "react";
import { Cloud, HardDrive, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getStorageStatus,
  onStorageStatusChange,
  type StorageStatus,
} from "@/lib/storageStatus";

export function StorageIndicator() {
  const [status, setStatus] = useState<StorageStatus>(getStorageStatus());

  useEffect(() => {
    const unsubscribe = onStorageStatusChange(setStatus);
    return unsubscribe;
  }, []);

  if (status.method === "r2" && status.isOnline) {
    return null; // Don't show indicator when everything is working normally
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge
        variant={status.method === "local" ? "destructive" : "secondary"}
        className="flex items-center gap-2 px-3 py-2"
      >
        {status.method === "local" ? (
          <HardDrive className="h-4 w-4" />
        ) : (
          <Cloud className="h-4 w-4" />
        )}
        {!status.isOnline ? (
          <WifiOff className="h-4 w-4" />
        ) : (
          <Wifi className="h-4 w-4" />
        )}
        <span className="text-xs">{status.message}</span>
      </Badge>
    </div>
  );
}
