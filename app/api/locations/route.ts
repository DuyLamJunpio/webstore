/**
 * Proxy danh sách địa giới hành chính sau sáp nhập.
 *
 * Chỉ Next server gọi ra ngoài: trình duyệt luôn cùng nguồn với webstore,
 * không phụ thuộc CORS của dịch vụ công khai. Danh sách ít thay đổi nên
 * lưu cache một ngày; endpoint vẫn lấy lại dữ liệu mới khi cache hết hạn.
 */

const API_BASE = "https://provinces.open-api.vn/api/v2";
const CACHE_SECONDS = 86_400;
const TIMEOUT_MS = 8_000;

type Location = { code: number; name: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function locations(value: unknown): Location[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.code !== "number" || typeof item.name !== "string") return [];

    return [{ code: item.code, name: item.name }];
  });
}

async function upstream(path: string): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "force-cache",
    next: { revalidate: CACHE_SECONDS },
  });
}

export async function GET(request: Request) {
  const provinceCode = new URL(request.url).searchParams.get("province");

  try {
    if (!provinceCode) {
      const response = await upstream("/");
      const provinces = locations(await response.json().catch(() => null));

      if (!response.ok || provinces.length === 0) {
        return Response.json({ error: "Không tải được danh sách tỉnh/thành phố." }, { status: 502 });
      }

      return Response.json(
        { provinces },
        { headers: { "Cache-Control": `public, max-age=${CACHE_SECONDS}` } },
      );
    }

    const code = Number(provinceCode);
    if (!Number.isInteger(code) || code <= 0) {
      return Response.json({ error: "Mã tỉnh/thành phố không hợp lệ." }, { status: 400 });
    }

    const response = await upstream(`/p/${code}?depth=2`);
    const payload: unknown = await response.json().catch(() => null);
    const wards = isRecord(payload) ? locations(payload.wards) : [];

    if (!response.ok) {
      return Response.json({ error: "Không tải được danh sách phường/xã." }, { status: 502 });
    }

    return Response.json(
      { wards },
      { headers: { "Cache-Control": `public, max-age=${CACHE_SECONDS}` } },
    );
  } catch {
    return Response.json({ error: "Dịch vụ địa giới đang tạm thời không phản hồi." }, { status: 502 });
  }
}
