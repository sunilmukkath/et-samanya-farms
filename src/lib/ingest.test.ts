import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bearerToken, commandFromDevice, parseIngestPayload } from "./ingest.ts";
import { liveStatus, newDeviceToken } from "./equipment.ts";

describe("parseIngestPayload", () => {
  it("lifts flat ESP32 fields into metrics", () => {
    const parsed = parseIngestPayload(
      { id: "soil-1", token: "abc", moisture: 22.4, battery: 91, tempC: 29 },
      null,
    );
    assert.ok(!("error" in parsed));
    if ("error" in parsed) return;
    assert.equal(parsed.deviceId, "soil-1");
    assert.equal(parsed.token, "abc");
    assert.equal(parsed.metrics.moisture, 22.4);
    assert.equal(parsed.metrics.battery, 91);
  });

  it("keeps nested metrics and header tokens", () => {
    const parsed = parseIngestPayload(
      { deviceId: "pump", metrics: { currentA: 4.2 }, state: "on" },
      bearerToken("Bearer secret"),
    );
    assert.ok(!("error" in parsed));
    if ("error" in parsed) return;
    assert.equal(parsed.token, "secret");
    assert.equal(parsed.state, "on");
    assert.equal(parsed.metrics.currentA, 4.2);
  });

  it("rejects non-objects", () => {
    const parsed = parseIngestPayload("nope", null);
    assert.ok("error" in parsed);
  });
});

describe("commandFromDevice", () => {
  it("only forwards on/off", () => {
    assert.equal(commandFromDevice("on").action, "on");
    assert.equal(commandFromDevice("off").action, "off");
    assert.equal(commandFromDevice("maybe").action, null);
  });
});

describe("liveStatus", () => {
  it("keeps planned devices planned", () => {
    assert.equal(liveStatus({ status: "planned", lastSeenAt: new Date() }), "planned");
  });

  it("marks stale gateways offline", () => {
    const old = new Date(Date.now() - 3 * 60 * 60 * 1000);
    assert.equal(liveStatus({ status: "online", lastSeenAt: old }), "offline");
  });
});

describe("newDeviceToken", () => {
  it("makes a url-safe secret", () => {
    const token = newDeviceToken();
    assert.match(token, /^[A-Za-z0-9_-]+$/);
    assert.ok(token.length >= 24);
  });
});
