import assert from "node:assert/strict";
import { once } from "node:events";
import http from "node:http";
import test from "node:test";
import express from "express";
import { createChordAnalysisProxy } from "../chordAnalysisProxy";

test("streams a multipart chord upload to the exact Flask path", async (t) => {
  let resolveRequest!: (request: { url: string; contentType: string; body: Buffer }) => void;
  const received = new Promise<{ url: string; contentType: string; body: Buffer }>((resolve) => {
    resolveRequest = resolve;
  });

  const backend = http.createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.on("end", () => {
      resolveRequest({
        url: request.url ?? "",
        contentType: String(request.headers["content-type"]),
        body: Buffer.concat(chunks),
      });
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end('{"status":"proxied"}');
    });
  });
  backend.listen(0, "127.0.0.1");
  await once(backend, "listening");
  t.after(() => backend.close());

  const address = backend.address();
  assert(address && typeof address === "object");
  const app = express();
  app.use(createChordAnalysisProxy(`http://127.0.0.1:${address.port}`));
  const gateway = app.listen(0, "127.0.0.1");
  await once(gateway, "listening");
  t.after(() => gateway.close());

  const gatewayAddress = gateway.address();
  assert(gatewayAddress && typeof gatewayAddress === "object");
  const form = new FormData();
  const audio = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0xff, 0x10]);
  form.append("file", new Blob([audio], { type: "audio/wav" }), "sample.wav");

  const response = await fetch(
    `http://127.0.0.1:${gatewayAddress.port}/api/analyze-chords?source=test`,
    { method: "POST", body: form },
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "proxied" });

  const forwarded = await received;
  assert.equal(forwarded.url, "/api/analyze-chords?source=test");
  assert.match(forwarded.contentType, /^multipart\/form-data; boundary=/);
  assert(forwarded.body.includes(Buffer.from('name="file"')));
  assert(forwarded.body.includes(Buffer.from('filename="sample.wav"')));
  assert(forwarded.body.includes(Buffer.from(audio)));
});
