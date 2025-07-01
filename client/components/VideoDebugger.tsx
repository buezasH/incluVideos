import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface VideoDebuggerProps {
  videoUrl: string;
  onTest?: (result: any) => void;
}

export function VideoDebugger({ videoUrl, onTest }: VideoDebuggerProps) {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);
  const testVideoRef = useRef<HTMLVideoElement>(null);

  const runDebugTest = async () => {
    const info: any = {
      timestamp: new Date().toISOString(),
      url: videoUrl,
      browser: navigator.userAgent,
      online: navigator.onLine,
      tests: {},
    };

    // Test 1: URL structure
    try {
      const url = new URL(videoUrl);
      info.tests.urlStructure = {
        valid: true,
        protocol: url.protocol,
        hostname: url.hostname,
        pathname: url.pathname,
        isR2: url.hostname.includes("r2.cloudflarestorage.com"),
      };
    } catch (e) {
      info.tests.urlStructure = {
        valid: false,
        error: e instanceof Error ? e.message : "Invalid URL",
      };
    }

    // Test 2: Network connectivity
    try {
      const response = await fetch(videoUrl, {
        method: "HEAD",
        mode: "cors",
      });
      info.tests.networkFetch = {
        accessible: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (e) {
      info.tests.networkFetch = {
        accessible: false,
        error: e instanceof Error ? e.message : "Network error",
      };
    }

    // Test 3: Video element test
    if (testVideoRef.current) {
      const video = testVideoRef.current;
      video.crossOrigin = "anonymous";
      video.preload = "metadata";

      const videoTest = await new Promise<any>((resolve) => {
        const timeout = setTimeout(() => {
          resolve({
            loadable: false,
            error: "Timeout after 10 seconds",
          });
        }, 10000);

        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          resolve({
            loadable: true,
            duration: video.duration,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            networkState: video.networkState,
            readyState: video.readyState,
          });
        };

        video.onerror = () => {
          clearTimeout(timeout);
          const error = video.error;
          resolve({
            loadable: false,
            errorCode: error?.code,
            errorMessage: error?.message,
            networkState: video.networkState,
            readyState: video.readyState,
          });
        };

        video.src = videoUrl;
      });

      info.tests.videoElement = videoTest;
    }

    // Test 4: CORS test with no-cors mode
    try {
      await fetch(videoUrl, {
        method: "GET",
        mode: "no-cors",
      });
      info.tests.corsNoCors = {
        accessible: true,
        note: "Request completed (no-cors mode)",
      };
    } catch (e) {
      info.tests.corsNoCors = {
        accessible: false,
        error: e instanceof Error ? e.message : "CORS error",
      };
    }

    setDebugInfo(info);
    onTest?.(info);

    // Log to console with better formatting
    console.group("🔍 Video Debug Results");
    console.log("📊 Full Debug Info:", info);
    console.log("🌐 URL Structure:", info.tests.urlStructure);
    console.log("🔗 Network Fetch:", info.tests.networkFetch);
    console.log("🎬 Video Element:", info.tests.videoElement);
    console.log("🌍 CORS Test:", info.tests.corsNoCors);
    console.groupEnd();
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-blue-800">🔍 Video Debugger</h3>
        <Button
          onClick={() => setIsVisible(!isVisible)}
          size="sm"
          variant="outline"
        >
          {isVisible ? "Hide" : "Show"} Debug
        </Button>
      </div>

      {isVisible && (
        <div className="space-y-3">
          <div className="text-sm text-blue-700">
            <strong>Video URL:</strong> {videoUrl}
          </div>

          <Button onClick={runDebugTest} size="sm" className="w-full">
            Run Debug Tests
          </Button>

          {/* Hidden video element for testing */}
          <video
            ref={testVideoRef}
            style={{ display: "none" }}
            muted
            preload="none"
          />

          {Object.keys(debugInfo).length > 0 && (
            <div className="bg-white p-3 rounded border">
              <h4 className="font-medium mb-2">Test Results:</h4>
              <pre className="text-xs overflow-auto max-h-64 whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}

          <div className="text-xs text-blue-600">
            <p>
              <strong>Tests performed:</strong>
            </p>
            <ul className="list-disc list-inside ml-2">
              <li>URL structure validation</li>
              <li>Network connectivity (CORS)</li>
              <li>Video element loading test</li>
              <li>No-CORS mode accessibility</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
