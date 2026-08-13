import test from "node:test";
import assert from "node:assert/strict";
import { isCanceledRequest, shouldRetryRequest } from "../src/utils/request.js";

test("safe reads retry transient network and service failures", () => {
  assert.equal(shouldRetryRequest({ method: "GET", hasResponse: false }), true);
  for (const status of [429, 502, 503, 504]) {
    assert.equal(shouldRetryRequest({ method: "get", status }), true);
  }
});

test("mutations, permanent failures, and exhausted reads never retry", () => {
  assert.equal(shouldRetryRequest({ method: "post", status: 503 }), false);
  assert.equal(shouldRetryRequest({ method: "get", status: 400 }), false);
  assert.equal(shouldRetryRequest({ method: "get", status: 503, attempt: 2 }), false);
  assert.equal(shouldRetryRequest({ method: "get", status: 503, canceled: true }), false);
});

test("canceled list requests are recognized as expected control flow", () => {
  assert.equal(isCanceledRequest({ code: "ERR_CANCELED" }), true);
  assert.equal(isCanceledRequest({ code: "ECONNRESET" }), false);
});
