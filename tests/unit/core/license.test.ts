import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  ShazLicenseError,
  isValidLicenseFormat,
  localizeLicenseError,
  normalizeLicenseKey,
  requireShazLicense,
  resolveLicenseVerifyUrl,
  verifyShazLicense
} from "@vision-ai/core";
import { verifyShazLicense as sdkVerifyShazLicense } from "vision-universal-ai";

describe("Shaz License Guard", () => {
  let tmpDir: string;
  let cachePath: string;
  const origEnv = { ...process.env };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shaz-license-test-"));
    cachePath = path.join(tmpDir, ".license_cache.json");
    delete process.env.SHAZ_LICENSE_KEY;
    delete process.env.SHAZ_LICENSE_API_URL;
    delete process.env.SHAZ_LICENSE_DOMAIN;
  });

  afterEach(() => {
    process.env = { ...origEnv };
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("validates and normalizes SHAZ license key format", () => {
    expect(normalizeLicenseKey("  shaz-1234-abcd-5678-ef90  ")).toBe("SHAZ-1234-ABCD-5678-EF90");
    expect(isValidLicenseFormat("SHAZ-1234-ABCD-5678-EF90")).toBe(true);
    expect(isValidLicenseFormat("shaz-a1b2-c3d4-e5f6-7890")).toBe(true);
    expect(isValidLicenseFormat("INVALID")).toBe(false);
    expect(isValidLicenseFormat("SHAZ-123-ABCD-5678-EF90")).toBe(false);
  });

  it("resolves verify endpoint URL cleanly", () => {
    expect(resolveLicenseVerifyUrl()).toBe("http://localhost:3000/api/licenses/verify");
    expect(resolveLicenseVerifyUrl("https://panel.shaz.vision/")).toBe(
      "https://panel.shaz.vision/api/licenses/verify"
    );
    expect(resolveLicenseVerifyUrl("https://panel.shaz.vision/api/licenses/verify")).toBe(
      "https://panel.shaz.vision/api/licenses/verify"
    );
  });

  it("localizes English and HTTP license errors into Turkish", () => {
    expect(localizeLicenseError("License revoked", 403).toLowerCase()).toContain("iptal");
    expect(localizeLicenseError("License expired").toLowerCase()).toContain("süresi dolmuş");
    expect(localizeLicenseError("License suspended").toLowerCase()).toContain("askıya");
    expect(localizeLicenseError("Domain mismatch").toLowerCase()).toContain("eşleşmiyor");
    expect(localizeLicenseError("Not found", 404).toLowerCase()).toContain("bulunamadı");
    expect(localizeLicenseError("fetch failed").toLowerCase()).toContain("ulaşılamadı");
  });

  it("rejects missing key and invalid format with ShazLicenseError", async () => {
    await expect(verifyShazLicense({ cachePath })).rejects.toThrow(ShazLicenseError);
    await expect(verifyShazLicense({ licenseKey: "BAD-KEY", cachePath })).rejects.toThrow(/format/i);
  });

  it("verifies active license, caches locally, and falls back to cache offline", async () => {
    const key = "SHAZ-1111-2222-3333-4444";
    const mockFetch: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          success: true,
          valid: true,
          status: "ACTIVE",
          type: "PRO",
          appName: "Vision Universal AI",
          domain: "sdk.local"
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    const res = await verifyShazLicense({
      licenseKey: key,
      domain: "sdk.local",
      cachePath,
      fetch: mockFetch
    });

    expect(res.valid).toBe(true);
    expect(res.status).toBe("ACTIVE");
    expect(res.cached).toBe(false);
    expect(fs.existsSync(cachePath)).toBe(true);

    // Offline network error -> falls back to valid cache
    const offlineFetch: typeof fetch = async () => {
      throw new Error("fetch failed: ECONNREFUSED");
    };
    const offlineRes = await requireShazLicense({
      licenseKey: key,
      domain: "sdk.local",
      cachePath,
      fetch: offlineFetch
    });

    expect(offlineRes.valid).toBe(true);
    expect(offlineRes.cached).toBe(true);
    expect(offlineRes.key).toBe(key);
  });

  it("clears cache and blocks when server explicitly rejects license", async () => {
    const key = "SHAZ-AAAA-BBBB-CCCC-DDDD";
    await verifyShazLicense({
      licenseKey: key,
      domain: "sdk.local",
      cachePath,
      fetch: async () =>
        new Response(JSON.stringify({ success: true, valid: true, status: "ACTIVE" }), { status: 200 })
    });
    expect(fs.existsSync(cachePath)).toBe(true);

    await expect(
      sdkVerifyShazLicense({
        licenseKey: key,
        domain: "sdk.local",
        cachePath,
        fetch: async () =>
          new Response(JSON.stringify({ success: false, valid: false, error: "License revoked" }), { status: 403 })
      })
    ).rejects.toThrow(/iptal/i);

    expect(fs.existsSync(cachePath)).toBe(false);
  });
});
