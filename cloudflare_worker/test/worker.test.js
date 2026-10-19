import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import worker from "../src/index.js";

const origin = "https://a3thonix.github.io";
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function environment(apiKey = "test-secret") {
  return {
    GEMINI_API_KEY: apiKey,
    RATE_LIMITER: { limit: async () => ({ success: true }) },
  };
}

function request(body, requestOrigin = origin, method = "POST") {
  return new Request("https://api.example.test/api/explain", {
    method,
    headers: {
      Origin: requestOrigin,
      "Content-Type": "application/json",
    },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
}

test("rejects requests from other origins", async () => {
  const response = await worker.fetch(request({ news: "headline" }, "https://evil.example"), environment());
  assert.equal(response.status, 403);
});

test("rejects requests to other paths", async () => {
  const response = await worker.fetch(
    new Request("https://api.example.test/", {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify({ news: "headline" }),
    }),
    environment(),
  );
  assert.equal(response.status, 404);
});

test("handles preflight without calling the Gemini API", async () => {
  const response = await worker.fetch(request(undefined, origin, "OPTIONS"), environment());
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
});

test("returns a useful error if the API secret is missing", async () => {
  const response = await worker.fetch(request({ news: "headline" }), environment(""));
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /not configured/i);
});

test("validates empty headlines", async () => {
  const response = await worker.fetch(request({ news: "  " }), environment());
  assert.equal(response.status, 400);
});

test("sends a bounded Gemini request with the API key in a header", async () => {
  let upstreamRequest;
  globalThis.fetch = async (url, options) => {
    upstreamRequest = { url, options };
    return Response.json({
      candidates: [{ content: { parts: [{ text: "Check reliable sources before sharing." }] } }],
    });
  };

  const response = await worker.fetch(request({ news: "A short headline" }), environment());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { explanation: "Check reliable sources before sharing." });
  assert.equal(upstreamRequest.options.headers["x-goog-api-key"], "test-secret");
  assert.equal(new URL(upstreamRequest.url).search, "");
  assert.equal(JSON.parse(upstreamRequest.options.body).generationConfig.maxOutputTokens, 350);
});

test("returns a retry message when Gemini quota is exhausted", async () => {
  globalThis.fetch = async () => new Response("quota", { status: 429 });
  const response = await worker.fetch(request({ news: "A short headline" }), environment());
  assert.equal(response.status, 429);
  assert.match((await response.json()).error, /quota/i);
});
