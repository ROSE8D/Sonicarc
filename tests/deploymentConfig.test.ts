import assert from "node:assert/strict";
import test from "node:test";
import { resolveFlaskBackendUrl } from "../deploymentConfig";

test("uses the local Flask backend when no deployment value is configured", () => {
  assert.equal(resolveFlaskBackendUrl(undefined), "http://127.0.0.1:5000");
});

test("converts Render hostport service references into absolute proxy URLs", () => {
  assert.equal(
    resolveFlaskBackendUrl("sonicarc-audio-backend:10000"),
    "http://sonicarc-audio-backend:10000",
  );
});

test("preserves absolute backend URLs and removes surrounding whitespace", () => {
  assert.equal(
    resolveFlaskBackendUrl("  https://sonicarc-audio-backend.onrender.com/  "),
    "https://sonicarc-audio-backend.onrender.com",
  );
});

test("rejects protocols that the HTTP proxy cannot use", () => {
  assert.throws(
    () => resolveFlaskBackendUrl("file:///tmp/backend.sock"),
    /must use HTTP or HTTPS/,
  );
});
