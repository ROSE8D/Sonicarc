import type { RequestHandler } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

/**
 * Proxy chord uploads before any Express body parser consumes the request.
 *
 * The middleware is deliberately mounted at the application root. Express
 * otherwise removes the mount path from `req.url`, which requires a fragile
 * pathRewrite to reconstruct the Flask route. Keeping the original URL also
 * lets http-proxy stream multipart bodies (including their boundary) unchanged.
 */
export function createChordAnalysisProxy(target: string): RequestHandler {
  return createProxyMiddleware({
    pathFilter: "/api/analyze-chords",
    target,
    changeOrigin: true,
    proxyTimeout: 120_000,
    timeout: 120_000,
    on: {
      error(error, _request, response) {
        console.error("Chord analysis proxy failed:", error);
        if ("writeHead" in response && !response.headersSent) {
          response.writeHead(502, { "Content-Type": "application/json" });
        }
        if ("end" in response && !response.writableEnded) {
          response.end(JSON.stringify({ error: "The audio analysis service is unavailable." }));
        }
      },
    },
  });
}
