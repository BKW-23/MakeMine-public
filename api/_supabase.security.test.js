import test from "node:test";
import assert from "node:assert/strict";
import { generateOrderCode, checkRateLimit, buildStockUsageMap, buildOrderConfirmationEmail } from "./_supabase.js";

test("generateOrderCode returns a non-empty alphanumeric code", () => {
  const code = generateOrderCode();
  assert.match(code, /^MM-[A-Z0-9-]+$/i);
  assert.ok(code.length >= 12);
});

test("checkRateLimit blocks requests after configured limit", async () => {
  const key = "test-ip-1";
  const windowMs = 60_000;
  const limit = 2;

  assert.equal(await checkRateLimit(key, limit, windowMs), true);
  assert.equal(await checkRateLimit(key, limit, windowMs), true);
  assert.equal(await checkRateLimit(key, limit, windowMs), false);
});

test("checkRateLimit parses Upstash pipeline responses correctly", async () => {
  const originalFetch = global.fetch;
  const responses = [
    { ok: true, json: async () => [{ result: 1 }] },
    { ok: true, json: async () => [{ result: 1 }] },
    { ok: true, json: async () => [{ result: 2 }] },
  ];

  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "token";
  global.fetch = async () => responses.shift();

  try {
    assert.equal(await checkRateLimit("upstash-test", 1, 60_000), true);
    assert.equal(await checkRateLimit("upstash-test", 1, 60_000), false);
  } finally {
    global.fetch = originalFetch;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  }
});

test("buildStockUsageMap aggregates duplicate products and order confirmation payload is valid", () => {
  const usage = buildStockUsageMap([
    { product_id: "p-1", quantity: 2 },
    { product_id: "p-1", quantity: 1 },
    { product_id: "p-2", quantity: 3 },
  ]);

  assert.deepEqual(usage, { "p-1": 3, "p-2": 3 });

  const payload = buildOrderConfirmationEmail({
    customer_name: "Lan",
    customer_email: "lan@example.com",
    order_code: "MM-ABC123",
    total: 250000,
  });

  assert.equal(payload.to, "lan@example.com");
  assert.match(payload.subject, /MM-ABC123/i);
  assert.match(payload.html, /250.000/i);
});
