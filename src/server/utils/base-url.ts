import assert from "assert";
import { env } from "../env";

/**
 * Get the base URL for the application, optionally for a specific port.
 * 
 * In TrySolid preview environments, the BASE_URL may not be set, so we need to
 * detect it from the environment or use sensible defaults.
 * 
 * @param port - The port number, or undefined for the primary port (8000)
 * @returns The base URL for the application
 */
export function getBaseUrl({ port }: { port?: number } = {}): string {
  if (port === undefined || port === 8000) {
    // it's the primary port
    if (env.BASE_URL) {
      return env.BASE_URL;
    }
    
    // Auto-detect for TrySolid preview or other environments
    // Check if we're in a preview environment (Codapt/TrySolid)
    if (process.env.CODAPT_PREVIEW_URL) {
      return process.env.CODAPT_PREVIEW_URL;
    }
    
    // Check for common hosting environment variables
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    
    if (process.env.RENDER_EXTERNAL_URL) {
      return process.env.RENDER_EXTERNAL_URL;
    }
    
    // Default to localhost for development
    return "http://localhost:8000";
  }

  // it's a secondary port

  if (env.BASE_URL_OTHER_PORT) {
    return env.BASE_URL_OTHER_PORT.replace("[PORT]", port.toString());
  }

  const primaryBaseUrl = getBaseUrl();
  
  // For localhost/http, just change the port
  if (primaryBaseUrl.startsWith("http://")) {
    const urlParts = primaryBaseUrl.split("://");
    const hostParts = urlParts[1]!.split(":");
    return `${urlParts[0]}://${hostParts[0]}:${port}`;
  }

  // For HTTPS URLs, we need to handle subdomain-based routing
  // TrySolid/Codapt preview uses pattern: preview-{id}.codapt.app
  // For secondary ports, they typically expose them directly or not at all
  // Since TrySolid preview doesn't expose secondary ports externally,
  // we'll return the primary URL with a warning
  
  console.warn(
    `Secondary port ${port} requested but HTTPS URL detected. ` +
    `TrySolid preview environments typically don't expose secondary ports. ` +
    `Returning primary URL instead.`
  );
  
  return primaryBaseUrl;
}
