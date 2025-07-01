/**
 * CORS Helper Utility
 * Helps diagnose CORS issues and provides configuration guidance
 */

/**
 * Gets the current domain information
 */
export const getCurrentDomainInfo = () => {
  return {
    origin: window.location.origin,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    port: window.location.port,
    fullUrl: window.location.href,
  };
};

/**
 * Generates CORS configuration for the current domain
 */
export const generateCorsConfig = () => {
  const domain = getCurrentDomainInfo();

  return {
    AllowedOrigins: [
      "http://localhost:3000",
      "http://localhost:8080",
      domain.origin,
      "*", // Fallback for development
    ],
    AllowedMethods: ["GET", "POST", "DELETE", "PUT", "HEAD"],
    AllowedHeaders: [
      "Content-Type",
      "Authorization",
      "Range",
      "Accept",
      "Accept-Encoding",
    ],
    ExposeHeaders: ["Content-Length", "Content-Range", "Accept-Ranges"],
  };
};

/**
 * Logs CORS debugging information
 */
export const logCorsDebugInfo = () => {
  const domain = getCurrentDomainInfo();
  const corsConfig = generateCorsConfig();

  console.group("🌐 CORS Debug Information");
  console.log("📍 Current Domain:", domain);
  console.log("⚙️ Suggested CORS Config:", corsConfig);
  console.log("📋 Copy this to your Cloudflare R2 CORS settings:");
  console.log(JSON.stringify([corsConfig], null, 2));
  console.groupEnd();

  return { domain, corsConfig };
};

/**
 * Tests CORS headers for a given URL
 */
export const testCorsHeaders = async (url: string) => {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      mode: "cors",
    });

    const corsHeaders = {
      "access-control-allow-origin": response.headers.get(
        "access-control-allow-origin",
      ),
      "access-control-allow-methods": response.headers.get(
        "access-control-allow-methods",
      ),
      "access-control-allow-headers": response.headers.get(
        "access-control-allow-headers",
      ),
      "access-control-expose-headers": response.headers.get(
        "access-control-expose-headers",
      ),
    };

    console.log("🔍 CORS Headers from server:", corsHeaders);
    return { success: true, headers: corsHeaders };
  } catch (error) {
    console.error("❌ CORS test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
