import { VisionAIError } from "./errors/index.js";

export const SHAZ_LICENSE_KEY_PATTERN = /^SHAZ-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
export const DEFAULT_LICENSE_API_URL = "http://localhost:3000/api/licenses/verify";
export const DEFAULT_LICENSE_APP_SLUG = "shaz-universal-ai";
export const DEFAULT_LICENSE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const DEFAULT_LICENSE_TIMEOUT_MS = 8000;

export interface VerifyLicenseOptions {
  licenseKey?: string;
  domain?: string;
  apiUrl?: string;
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
  cachePath?: string;
  cacheTtlMs?: number;
  useCache?: boolean;
}

export interface LicenseVerificationResult {
  valid: boolean;
  status: string;
  key: string;
  domain: string;
  type?: string;
  appName?: string;
  cached: boolean;
  verifiedAt: number;
  error?: string;
}

interface CachedLicensePayload {
  valid: boolean;
  status: string;
  key: string;
  domain: string;
  type?: string;
  appName?: string;
  verifiedAt: number;
}

export class ShazLicenseError extends VisionAIError {
  public readonly code: string;

  constructor(
    message: string,
    options?: {
      code?: string;
      statusCode?: number;
      rawError?: unknown;
    }
  ) {
    super(message, {
      provider: "shaz-license",
      statusCode: options?.statusCode,
      retryable: false,
      rawError: options?.rawError
    });
    this.name = "ShazLicenseError";
    this.code = options?.code ?? "LICENSE_ERROR";
  }
}

export function normalizeLicenseKey(key?: string | null): string {
  return (key ?? "").trim().toUpperCase();
}

export function isValidLicenseFormat(key?: string | null): boolean {
  return SHAZ_LICENSE_KEY_PATTERN.test(normalizeLicenseKey(key));
}

export function resolveLicenseVerifyUrl(apiUrl?: string): string {
  const envUrl =
    typeof process !== "undefined" && process.env ? process.env.SHAZ_LICENSE_API_URL : undefined;
  const raw = (apiUrl ?? envUrl ?? "").trim();
  if (!raw) {
    return DEFAULT_LICENSE_API_URL;
  }
  const cleaned = raw.replace(/\/+$/, "");
  if (cleaned.endsWith("/api/licenses/verify")) {
    return cleaned;
  }
  return `${cleaned}/api/licenses/verify`;
}

export async function resolveLicenseDomain(
  domain?: string,
  appSlug: string = DEFAULT_LICENSE_APP_SLUG
): Promise<string> {
  const envDomain =
    typeof process !== "undefined" && process.env ? process.env.SHAZ_LICENSE_DOMAIN : undefined;
  const explicit = (domain ?? envDomain ?? "").trim();
  if (explicit) {
    return explicit;
  }
  try {
    if (typeof process !== "undefined" && process.versions?.node) {
      const osMod = await import("node:os");
      const hostname = osMod.hostname().trim();
      if (hostname) {
        return `${hostname}/${appSlug}`;
      }
    }
  } catch {
    // Fallback to environment / appSlug
  }
  if (typeof process !== "undefined" && process.env) {
    const host = (process.env.COMPUTERNAME || process.env.HOSTNAME || "").trim();
    if (host) {
      return `${host}/${appSlug}`;
    }
  }
  return appSlug;
}

export function localizeLicenseError(rawError?: string | null, statusCode?: number): string {
  const msg = (rawError ?? "").trim();
  const lower = msg.toLowerCase();

  if (lower.includes("format") || lower.includes("malformed") || lower.includes("pattern")) {
    return "Geçersiz lisans anahtarı formatı. Doğru format: SHAZ-XXXX-XXXX-XXXX-XXXX.";
  }
  if (lower.includes("missing") || lower.includes("required") || lower.includes("empty")) {
    return "Lisans anahtarı belirtilmedi. Lütfen SHAZ_LICENSE_KEY değişkenini girin.";
  }
  if (lower.includes("revoked") || lower.includes("cancelled") || lower.includes("canceled")) {
    return "Bu lisans anahtarı iptal edilmiş.";
  }
  if (
    lower.includes("suspended") ||
    lower.includes("paused") ||
    lower.includes("inactive") ||
    lower.includes("disabled") ||
    lower.includes("blocked")
  ) {
    return "Bu lisans anahtarı askıya alınmış veya devre dışı bırakılmış.";
  }
  if (lower.includes("expired")) {
    return "Bu lisans anahtarının kullanım süresi dolmuş.";
  }
  if (
    lower.includes("domain") ||
    lower.includes("host") ||
    lower.includes("mismatch") ||
    lower.includes("bound") ||
    lower.includes("device")
  ) {
    return "Lisans anahtarı bu alan adı veya cihaz ile eşleşmiyor.";
  }
  if (
    lower.includes("not found") ||
    lower.includes("invalid license") ||
    lower.includes("invalid key") ||
    lower.includes("invalid")
  ) {
    return "Lisans anahtarı bulunamadı veya geçersiz.";
  }
  if (statusCode === 429 || lower.includes("rate limit") || lower.includes("too many")) {
    return "Çok fazla lisans doğrulama isteği gönderildi. Lütfen biraz sonra tekrar deneyin.";
  }
  if (statusCode === 401 || statusCode === 403 || lower.includes("unauthorized") || lower.includes("forbidden")) {
    return "Lisans doğrulama yetkisi reddedildi.";
  }
  if (statusCode === 404) {
    return "Lisans anahtarı bulunamadı veya geçersiz.";
  }
  if (lower.includes("timed out") || lower.includes("timeout") || lower.includes("aborted")) {
    return "Lisans sunucusu zaman aşımına uğradı. Lütfen ağ bağlantınızı kontrol edin.";
  }
  if (
    lower.includes("fetch failed") ||
    lower.includes("econnrefused") ||
    lower.includes("enotfound") ||
    lower.includes("connection") ||
    lower.includes("network") ||
    lower.includes("unreachable")
  ) {
    return "Lisans sunucusuna ulaşılamadı. Sunucunun çalıştığından ve SHAZ_LICENSE_API_URL ayarının doğru olduğundan emin olun.";
  }
  if (statusCode !== undefined && statusCode >= 500) {
    return "Lisans sunucusunda geçici bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
  }

  const turkishMarkers = ["lisans", "anahtar", "geçersiz", "iptal", "süresi", "alan adı", "sunucu", "doğrula"];
  if (msg && turkishMarkers.some((marker) => lower.includes(marker))) {
    return msg;
  }

  if (msg) {
    return "Lisans doğrulama başarısız oldu. Lütfen lisans anahtarınızı kontrol edin.";
  }
  return "Lisans doğrulanamadı. Lütfen SHAZ_LICENSE_KEY ayarını kontrol edin.";
}

async function getDefaultCachePath(): Promise<string | null> {
  try {
    if (typeof process !== "undefined" && process.versions?.node) {
      const pathMod = await import("node:path");
      return pathMod.resolve(process.cwd(), ".license_cache.json");
    }
  } catch {
    // Ignore in non-Node runtimes
  }
  return null;
}

async function readLicenseCache(
  cachePath: string | null,
  key: string,
  domain: string,
  cacheTtlMs: number
): Promise<LicenseVerificationResult | null> {
  if (!cachePath) return null;
  try {
    const fsMod = await import("node:fs/promises");
    const raw = await fsMod.readFile(cachePath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<CachedLicensePayload>;
    if (!parsed || !parsed.valid || parsed.key !== key || parsed.domain !== domain) {
      return null;
    }
    if (typeof parsed.verifiedAt !== "number" || Date.now() - parsed.verifiedAt > cacheTtlMs) {
      return null;
    }
    return {
      valid: true,
      status: String(parsed.status || "ACTIVE"),
      key,
      domain,
      type: parsed.type,
      appName: parsed.appName,
      cached: true,
      verifiedAt: parsed.verifiedAt
    };
  } catch {
    return null;
  }
}

async function writeLicenseCache(cachePath: string | null, payload: CachedLicensePayload): Promise<void> {
  if (!cachePath) return;
  try {
    const fsMod = await import("node:fs/promises");
    const pathMod = await import("node:path");
    await fsMod.mkdir(pathMod.dirname(cachePath), { recursive: true });
    await fsMod.writeFile(cachePath, JSON.stringify(payload, null, 2), "utf-8");
  } catch {
    // Non-fatal if cache cannot be written
  }
}

async function clearLicenseCache(cachePath: string | null): Promise<void> {
  if (!cachePath) return;
  try {
    const fsMod = await import("node:fs/promises");
    await fsMod.unlink(cachePath);
  } catch {
    // Ignore if file does not exist
  }
}

export async function verifyShazLicense(
  optionsOrKey?: string | VerifyLicenseOptions
): Promise<LicenseVerificationResult> {
  const options: VerifyLicenseOptions =
    typeof optionsOrKey === "string" ? { licenseKey: optionsOrKey } : (optionsOrKey ?? {});

  const envKey =
    typeof process !== "undefined" && process.env ? process.env.SHAZ_LICENSE_KEY : undefined;
  const normalizedKey = normalizeLicenseKey(options.licenseKey ?? envKey);

  if (!normalizedKey) {
    throw new ShazLicenseError(
      "Lisans anahtarı bulunamadı. Lütfen SHAZ_LICENSE_KEY ortam değişkenini ayarlayın.",
      { code: "MISSING_KEY", statusCode: 400 }
    );
  }

  if (!isValidLicenseFormat(normalizedKey)) {
    throw new ShazLicenseError(
      "Geçersiz lisans anahtarı formatı. Doğru format: SHAZ-XXXX-XXXX-XXXX-XXXX.",
      { code: "INVALID_FORMAT", statusCode: 400 }
    );
  }

  const resolvedDomain = await resolveLicenseDomain(options.domain);
  const resolvedUrl = resolveLicenseVerifyUrl(options.apiUrl);
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_LICENSE_TIMEOUT_MS;
  const useCache = options.useCache ?? true;
  const cacheTtlMs = options.cacheTtlMs ?? DEFAULT_LICENSE_CACHE_TTL_MS;
  const cachePath = useCache ? (options.cachePath ?? (await getDefaultCachePath())) : null;

  if (typeof fetchImpl !== "function") {
    throw new ShazLicenseError(
      "Bu çalışma ortamında HTTP fetch desteği bulunamadı.",
      { code: "FETCH_UNAVAILABLE" }
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetchImpl(resolvedUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ key: normalizedKey, domain: resolvedDomain }),
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timer);
    const cached = await readLicenseCache(cachePath, normalizedKey, resolvedDomain, cacheTtlMs);
    if (cached) {
      return cached;
    }
    const errMsg = err instanceof Error ? err.message : String(err);
    throw new ShazLicenseError(localizeLicenseError(errMsg || "network error"), {
      code: "NETWORK_ERROR",
      rawError: err
    });
  }
  clearTimeout(timer);

  let data: Record<string, unknown> | null = null;
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const rawErr =
      (data && typeof data.error === "string" && data.error) ||
      (data && typeof data.message === "string" && data.message) ||
      response.statusText;

    if (response.status >= 500) {
      const cached = await readLicenseCache(cachePath, normalizedKey, resolvedDomain, cacheTtlMs);
      if (cached) {
        return cached;
      }
    }

    if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 404) {
      await clearLicenseCache(cachePath);
    }

    throw new ShazLicenseError(localizeLicenseError(rawErr, response.status), {
      code: response.status >= 500 ? "SERVER_ERROR" : "SERVER_REJECTED",
      statusCode: response.status,
      rawError: data ?? rawErr
    });
  }

  const statusText = String(data?.status ?? "").toUpperCase();
  const isBlockedStatus = ["REVOKED", "SUSPENDED", "EXPIRED", "INACTIVE"].includes(statusText);
  const isValid = Boolean(data && data.success && data.valid && !isBlockedStatus);

  if (!isValid) {
    await clearLicenseCache(cachePath);
    const rawErr =
      (data && typeof data.error === "string" && data.error) ||
      (data && typeof data.message === "string" && data.message) ||
      statusText ||
      null;
    throw new ShazLicenseError(localizeLicenseError(rawErr, response.status), {
      code: "LICENSE_INVALID",
      statusCode: response.status,
      rawError: data
    });
  }

  const verifiedAt = Date.now();
  const result: LicenseVerificationResult = {
    valid: true,
    status: statusText || "ACTIVE",
    key: normalizedKey,
    domain: resolvedDomain,
    type: typeof data?.type === "string" ? data.type : undefined,
    appName: typeof data?.appName === "string" ? data.appName : undefined,
    cached: false,
    verifiedAt
  };

  await writeLicenseCache(cachePath, {
    valid: true,
    status: result.status,
    key: result.key,
    domain: result.domain,
    type: result.type,
    appName: result.appName,
    verifiedAt
  });

  return result;
}

export async function requireShazLicense(
  options?: VerifyLicenseOptions
): Promise<LicenseVerificationResult> {
  return verifyShazLicense(options);
}
