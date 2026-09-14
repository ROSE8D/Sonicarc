const LOCAL_FLASK_BACKEND = "http://127.0.0.1:5000";

/**
 * Turn Render's `hostport` service reference (or a conventional absolute URL)
 * into the absolute URL required by the Node proxy.
 */
export function resolveFlaskBackendUrl(value = process.env.FLASK_BACKEND_URL): string {
  const configured = value?.trim() || LOCAL_FLASK_BACKEND;
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(configured)
    ? configured
    : `http://${configured}`;
  const url = new URL(candidate);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("FLASK_BACKEND_URL must use HTTP or HTTPS.");
  }

  return url.href.replace(/\/$/, "");
}
