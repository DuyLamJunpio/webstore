/**
 * Lớp gọi Shopee Open Platform v2 — ký chữ ký, giữ và tự làm mới access token.
 *
 * Chỉ chạy ở phía máy chủ / script. `SHOPEE_PARTNER_KEY` là khoá bí mật, không
 * bao giờ được đóng gói vào bundle trình duyệt, nên đừng import file này từ
 * component "use client".
 *
 * Tài liệu: https://open.shopee.com/documents/v2/introduction
 */

import { createHmac } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

// ── cấu hình ─────────────────────────────────────────────────────────

/**
 * Máy chủ Shopee. Sandbox (`test-stable`) và live là hai thế giới tách biệt:
 * partner_id, khoá và cả shop uỷ quyền đều khác nhau, không dùng chéo được.
 */
const HOSTS = {
  live: "https://partner.shopeemobile.com",
  sandbox: "https://partner.test-stable.shopeemobile.com",
} as const;

export const SHOPEE_HOST =
  process.env.SHOPEE_HOST?.replace(/\/+$/, "") ??
  (process.env.SHOPEE_ENV === "sandbox" ? HOSTS.sandbox : HOSTS.live);

export const PARTNER_ID = Number(process.env.SHOPEE_PARTNER_ID ?? 0);
const PARTNER_KEY = process.env.SHOPEE_PARTNER_KEY ?? "";
export const SHOP_ID = Number(process.env.SHOPEE_SHOP_ID ?? 0);

/** ngôn ngữ dùng cho tên danh mục — Shopee VN trả tiếng Việt khi truyền "vi" */
export const LANGUAGE = process.env.SHOPEE_LANGUAGE ?? "vi";

/**
 * Nơi cất token. Access token chỉ sống 4 tiếng còn refresh token 30 ngày, nên
 * nó phải nằm ngoài mã nguồn và được ghi đè sau mỗi lần làm mới — để trong
 * `.env` thì cứ 4 tiếng lại phải sửa tay một lần.
 */
const TOKEN_FILE = path.join(process.cwd(), ".shopee", "token.json");

export const isConfigured = () => PARTNER_ID > 0 && PARTNER_KEY.length > 0;

export function assertConfigured() {
  if (isConfigured()) return;
  throw new Error(
    "Thiếu cấu hình Shopee. Điền SHOPEE_PARTNER_ID và SHOPEE_PARTNER_KEY vào .env.local\n" +
      "(lấy tại https://open.shopee.com → App Management → App của bạn → App Key).",
  );
}

// ── chữ ký ───────────────────────────────────────────────────────────

/**
 * Shopee ký trên một chuỗi ghép chứ không phải trên body: ở API công khai là
 * `partner_id + path + timestamp`, ở API của shop thì nối thêm
 * `access_token + shop_id`. Sai thứ tự là lỗi `error_sign`, không có gợi ý gì thêm.
 */
const sign = (base: string) => createHmac("sha256", PARTNER_KEY).update(base).digest("hex");

const nowSeconds = () => Math.floor(Date.now() / 1000);

type CallOptions = {
  /** đường dẫn đầy đủ, ví dụ `/api/v2/product/get_item_list` */
  path: string;
  method?: "GET" | "POST";
  /** tham số query (ngoài các tham số ký) */
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  /** true với /auth/* — những endpoint chưa có (hoặc đang xin) token */
  publicApi?: boolean;
};

type ShopeeEnvelope<T> = { error?: string; message?: string; request_id?: string; response?: T };

/** Shopee trả HTTP 200 kèm `error` khác rỗng khi thất bại, nên phải tự bung lỗi. */
export async function call<T>(options: CallOptions): Promise<T> {
  assertConfigured();

  const { path: apiPath, method = "GET", query = {}, body, publicApi = false } = options;
  const timestamp = nowSeconds();

  const params = new URLSearchParams({
    partner_id: String(PARTNER_ID),
    timestamp: String(timestamp),
  });

  let base = `${PARTNER_ID}${apiPath}${timestamp}`;
  if (!publicApi) {
    const token = await accessToken();
    base += `${token}${SHOP_ID}`;
    params.set("access_token", token);
    params.set("shop_id", String(SHOP_ID));
  }
  params.set("sign", sign(base));

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }

  const response = await fetch(`${SHOPEE_HOST}${apiPath}?${params}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
    signal: AbortSignal.timeout(30_000),
  });

  const text = await response.text();
  let payload: ShopeeEnvelope<T>;
  try {
    payload = JSON.parse(text) as ShopeeEnvelope<T>;
  } catch {
    throw new Error(`${apiPath} → HTTP ${response.status}, phản hồi không phải JSON: ${text.slice(0, 300)}`);
  }

  if (payload.error) {
    throw new Error(`${apiPath} → ${payload.error}: ${payload.message ?? "(không có mô tả)"}`);
  }
  return (payload.response ?? (payload as unknown)) as T;
}

// ── uỷ quyền shop ────────────────────────────────────────────────────

export type StoredToken = {
  access_token: string;
  refresh_token: string;
  shop_id: number;
  /** epoch giây — thời điểm access token hết hạn (Shopee cấp 4 tiếng) */
  expires_at: number;
};

/**
 * Link để chủ shop bấm vào và đồng ý cho ứng dụng truy cập. Sau khi đồng ý,
 * Shopee chuyển hướng về `redirect` kèm `?code=...&shop_id=...`.
 */
export function authorizeUrl(redirect: string): string {
  assertConfigured();
  const apiPath = "/api/v2/shop/auth_partner";
  const timestamp = nowSeconds();
  const params = new URLSearchParams({
    partner_id: String(PARTNER_ID),
    timestamp: String(timestamp),
    sign: sign(`${PARTNER_ID}${apiPath}${timestamp}`),
    redirect,
  });
  return `${SHOPEE_HOST}${apiPath}?${params}`;
}

async function saveToken(token: StoredToken) {
  await mkdir(path.dirname(TOKEN_FILE), { recursive: true });
  await writeFile(TOKEN_FILE, `${JSON.stringify(token, null, 2)}\n`, "utf8");
}

export async function readToken(): Promise<StoredToken | null> {
  try {
    return JSON.parse(await readFile(TOKEN_FILE, "utf8")) as StoredToken;
  } catch {
    return null;
  }
}

type TokenResponse = { access_token: string; refresh_token: string; expire_in: number };

const store = async (data: TokenResponse, shopId: number) => {
  const token: StoredToken = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    shop_id: shopId,
    // trừ hao 5 phút: thà làm mới sớm còn hơn để một lệnh đang chạy dở gặp token chết
    expires_at: nowSeconds() + Math.max(0, data.expire_in - 300),
  };
  await saveToken(token);
  return token;
};

/** Đổi `code` (lấy từ URL redirect) lấy cặp token đầu tiên. */
export async function exchangeCode(code: string, shopId: number): Promise<StoredToken> {
  const data = await call<TokenResponse>({
    path: "/api/v2/auth/token/get",
    method: "POST",
    body: { code, shop_id: shopId, partner_id: PARTNER_ID },
    publicApi: true,
  });
  return store(data, shopId);
}

export async function refresh(token: StoredToken): Promise<StoredToken> {
  const data = await call<TokenResponse>({
    path: "/api/v2/auth/access_token/get",
    method: "POST",
    body: { refresh_token: token.refresh_token, shop_id: token.shop_id, partner_id: PARTNER_ID },
    publicApi: true,
  });
  return store(data, token.shop_id);
}

/** giữ trong bộ nhớ để một lần chạy script không đọc lại file hàng trăm lượt */
let cached: StoredToken | null = null;

export async function accessToken(): Promise<string> {
  cached ??= await readToken();
  if (!cached) {
    throw new Error(
      "Chưa uỷ quyền shop. Chạy `npm run shopee:auth` rồi làm theo hướng dẫn hiện ra.",
    );
  }
  if (cached.expires_at <= nowSeconds()) {
    cached = await refresh(cached);
  }
  return cached.access_token;
}
