import test from "node:test";
import assert from "node:assert/strict";
import { generateOrderCode, checkRateLimit } from "./_supabase.js";

test("generateOrderCode returns a non-empty alphanumeric code", () => {
  const code = generateOrderCode();
  assert.match(code, /^MM-[A-Z0-9-]+$/i);
  assert.ok(code.length >= 12);
});

test("checkRateLimit blocks requests after configured limit", () => {
  const key = "test-ip-1";
  const windowMs = 60_000;
  const limit = 2;

  assert.equal(checkRateLimit(key, limit, windowMs), true);
  assert.equal(checkRateLimit(key, limit, windowMs), true);
  assert.equal(checkRateLimit(key, limit, windowMs), false);
});
