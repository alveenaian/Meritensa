import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./root";

export default async (event: any) => {
  // Get the URL path from the event
  const url = event.path || event.node.req.url || "";
  const method = event.method || event.node.req.method || "GET";

  // Simple health check endpoint for Docker healthcheck
  if (url === "/health" && method === "GET") {
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get the full URL from the request
  const protocol = event.node.req.headers["x-forwarded-proto"] || "http";
  const host = event.node.req.headers.host || "localhost:3000";
  const fullUrl = `${protocol}://${host}${url}`;

  // Read the request body if it's a POST/PUT/PATCH request
  let body: BodyInit | undefined = undefined;
  if (method !== "GET" && method !== "HEAD") {
    const chunks: Buffer[] = [];
    for await (const chunk of event.node.req) {
      chunks.push(chunk);
    }
    body = Buffer.concat(chunks);
  }

  // Create a proper Web Request
  const request = new Request(fullUrl, {
    method: method,
    headers: event.node.req.headers as HeadersInit,
    body: body,
  });

  return fetchRequestHandler({
    endpoint: "/",
    req: request,
    router: appRouter,
    createContext() {
      return {};
    },
    onError({ error, path }) {
      console.error(`tRPC error on '${path}':`, error);
    },
  });
};
