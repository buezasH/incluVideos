import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface R2UrlTesterProps {
  videoUrl?: string;
}

export function R2UrlTester({ videoUrl }: R2UrlTesterProps) {
  const [testUrl, setTestUrl] = useState(videoUrl || "");
  const [result, setResult] = useState<string>("");

  const testUrl2 = async () => {
    if (!testUrl) return;

    setResult("Testing...");

    try {
      // Test 1: Basic fetch
      console.log("Testing URL:", testUrl);

      const response = await fetch(testUrl, {
        method: "HEAD",
        mode: "cors",
      });

      if (response.ok) {
        setResult(`✅ URL accessible! Status: ${response.status}`);
        console.log("Response headers:", [...response.headers.entries()]);
      } else {
        setResult(`❌ URL failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setResult(
        `❌ Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      console.error("URL test error:", error);
    }
  };

  const testVideoElement = async () => {
    if (!testUrl) return;

    setResult("Testing with video element...");

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "metadata";

    const testPromise = new Promise<string>((resolve) => {
      const timeout = setTimeout(() => {
        resolve("⏱️ Timeout - video took too long to load");
      }, 10000);

      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        resolve(
          `✅ Video loaded! Duration: ${video.duration}s, Size: ${video.videoWidth}x${video.videoHeight}`,
        );
      };

      video.onerror = () => {
        clearTimeout(timeout);
        const error = video.error;
        let errorMsg = "❌ Video error";
        if (error) {
          switch (error.code) {
            case 1:
              errorMsg += " - ABORTED";
              break;
            case 2:
              errorMsg += " - NETWORK";
              break;
            case 3:
              errorMsg += " - DECODE";
              break;
            case 4:
              errorMsg += " - SRC_NOT_SUPPORTED";
              break;
          }
        }
        resolve(errorMsg);
      };

      video.src = testUrl;
    });

    const result = await testPromise;
    setResult(result);
  };

  if (!testUrl) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
      <h3 className="font-medium text-yellow-800 mb-3">🔧 R2 URL Debugger</h3>

      <div className="space-y-3">
        <Input
          value={testUrl}
          onChange={(e) => setTestUrl(e.target.value)}
          placeholder="Enter R2 URL to test"
          className="text-sm"
        />

        <div className="flex gap-2">
          <Button onClick={testUrl2} size="sm" variant="outline">
            Test Fetch
          </Button>
          <Button onClick={testVideoElement} size="sm" variant="outline">
            Test Video Element
          </Button>
        </div>

        {result && (
          <div className="bg-white p-3 rounded border text-sm">{result}</div>
        )}

        <div className="text-xs text-yellow-700">
          <p>
            <strong>Expected format:</strong>{" "}
            https://dee356186b2b200c89bcad92b58cdbb4.r2.cloudflarestorage.com/incluvid/videos/videoId.mp4
          </p>
        </div>
      </div>
    </div>
  );
}
