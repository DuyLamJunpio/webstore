/**
 * Nội dung trang chủ chỉnh từ trang quản trị: slide hero, chữ chạy, tiêu đề.
 *
 * Cùng cơ chế với `lib/catalogue.ts`: đọc lúc chạy, có nhãn cache riêng để
 * trang quản trị xoá được ngay sau khi chủ shop bấm lưu.
 *
 * Gọi không được thì lùi về nội dung mặc định bên dưới — thà hiện banner cũ
 * còn hơn đầu trang trắng trơn.
 *
 * Chỉ dùng ở phía máy chủ. Client component nhận dữ liệu qua props.
 */

import { cache } from "react";

import { SALES_MAC_DINH, type SalesSettings } from "./sales";

/** Nhãn cache riêng, để lưu banner không phải dựng lại cả catalogue sản phẩm. */
export const CONTENT_TAG = "content";

const REVALIDATE_SECONDS = 60;
const TIMEOUT_MS = 10_000;

const BASE = (process.env.WAREHOUSE_API_URL ?? "").replace(/\/$/, "");

export type HeroSlide = {
  id: number | string;
  media: string;
  mediaType: "image" | "video";
  poster: string | null;
  /** Ảnh thay cho video trên điện thoại, để khách không phải tải cả file video. */
  mobile: string | null;
  alt: string;
  heading: string | null;
  subheading: string | null;
  ctaLabel: string | null;
  ctaLink: string | null;
};

export type Collection = {
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaLink: string | null;
  /** Slug các sản phẩm chủ shop đã tích, giữ đúng thứ tự đã chọn. */
  productSlugs: string[];
};

export type SiteContent = {
  slides: HeroSlide[];
  /** Bộ sưu tập chủ shop tự chọn; chưa tạo cái nào thì null và web ẩn khối đó. */
  collection: Collection | null;
  /** Dải chữ nhỏ trên cùng, hiện ở mọi trang. */
  announcement: string[];
  headings: Record<string, string>;
  /** Hình thức thanh toán và phí giao hàng, chỉnh bên trang quản trị. */
  sales: SalesSettings;
};

/**
 * Nội dung dùng khi chưa ai đặt gì bên quản trị, hoặc khi không gọi được.
 * Chính là nội dung vốn nằm cứng trong Hero.tsx và Marquee.tsx trước đây.
 */
const MAC_DINH: SiteContent = {
  slides: [
    {
      id: "mac-dinh-1",
      media: "/images/hero-1.png",
      mediaType: "image",
      poster: null,
      mobile: null,
      alt: "Người mẫu mặc áo khoác phối khối màu của mùa mới",
      heading: "Phong Cách Chuyển Động",
      subheading: "Những món đồ mùa mới cho sự tự tin mỗi ngày.",
      ctaLabel: "Mua ngay",
      ctaLink: "/shop",
    },
    {
      id: "mac-dinh-2",
      media: "/images/hero-2.png",
      mediaType: "image",
      poster: null,
      mobile: null,
      alt: "Người mẫu mặc áo khoác da lúc hoàng hôn",
      heading: null,
      subheading: null,
      ctaLabel: null,
      ctaLink: null,
    },
  ],
  collection: null,
  announcement: ["Ưu đãi mùa mới", "Giảm đến 30%", "Miễn phí giao hàng từ 500.000 ₫"],
  headings: {},
  sales: SALES_MAC_DINH,
};

type ApiContent = {
  banners?: Array<{
    id: number;
    media: string;
    media_type: string;
    poster: string | null;
    mobile: string | null;
    alt: string | null;
    heading: string | null;
    subheading: string | null;
    cta_label: string | null;
    cta_link: string | null;
  }>;
  collection?: {
    title: string;
    subtitle: string | null;
    cta_label: string | null;
    cta_link: string | null;
    product_slugs: string[];
  } | null;
  announcement?: string[];
  headings?: Record<string, string>;
  sales?: Record<
    string,
    {
      enabled?: boolean;
      free_shipping?: boolean;
      shipping_fee?: number;
      free_shipping_min_items?: number | null;
    }
  >;
};

/** Trang quản trị trả đường dẫn tương đối, ghép với địa chỉ của nó. */
const mediaUrl = (path: string) => (path.startsWith("http") ? path : `${BASE}${path}`);

/**
 * Bản quản trị cũ chưa trả khối `sales`, và một khoá thiếu cũng không được phép
 * làm hỏng cả trang, nên mỗi trường đều lùi về mặc định riêng của nó.
 */
function napSales(sales: ApiContent["sales"]): SalesSettings {
  const doc = (key: keyof SalesSettings) => {
    const raw = sales?.[key];
    const macDinh = SALES_MAC_DINH[key];
    if (!raw) return macDinh;

    return {
      enabled: raw.enabled ?? macDinh.enabled,
      freeShipping: raw.free_shipping ?? macDinh.freeShipping,
      shippingFee: Math.max(0, raw.shipping_fee ?? macDinh.shippingFee),
      freeShippingMinItems: raw.free_shipping_min_items ?? null,
    };
  };

  return { bank_transfer: doc("bank_transfer"), cod: doc("cod") };
}

async function fetchContent(): Promise<SiteContent | null> {
  if (!BASE) {
    console.error("[content] thiếu WAREHOUSE_API_URL — đang dùng nội dung mặc định");
    return null;
  }

  try {
    const response = await fetch(`${BASE}/api/storefront/content`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS, tags: [CONTENT_TAG] },
    });

    if (!response.ok) {
      console.error(`[content] trang quản trị trả về HTTP ${response.status}`);
      return null;
    }

    const data = (await response.json()) as ApiContent;

    const slides: HeroSlide[] = (data.banners ?? []).map((b) => ({
      id: b.id,
      media: mediaUrl(b.media),
      mediaType: b.media_type === "video" ? "video" : "image",
      poster: b.poster ? mediaUrl(b.poster) : null,
      mobile: b.mobile ? mediaUrl(b.mobile) : null,
      alt: b.alt ?? "",
      heading: b.heading,
      subheading: b.subheading,
      ctaLabel: b.cta_label,
      ctaLink: b.cta_link,
    }));

    return {
      // Chưa ai thêm slide nào thì giữ ảnh mặc định, đừng để đầu trang trống.
      slides: slides.length > 0 ? slides : MAC_DINH.slides,
      collection: data.collection
        ? {
            title: data.collection.title,
            subtitle: data.collection.subtitle,
            ctaLabel: data.collection.cta_label,
            ctaLink: data.collection.cta_link,
            productSlugs: data.collection.product_slugs ?? [],
          }
        : null,
      announcement: data.announcement?.length ? data.announcement : MAC_DINH.announcement,
      headings: data.headings ?? {},
      sales: napSales(data.sales),
    };
  } catch (error) {
    console.error("[content] không đọc được nội dung trang chủ", error);
    return null;
  }
}

/**
 * `cache()` gom mọi lời gọi trong cùng một lượt dựng trang về một lần: hero,
 * dải chữ chạy và các khối tiêu đề đều cần dữ liệu này.
 */
export const getContent = cache(async (): Promise<SiteContent> => {
  return (await fetchContent()) ?? MAC_DINH;
});

/**
 * Lấy tiêu đề theo khoá, chưa ai sửa thì trả về chữ mặc định truyền vào.
 * Nhờ vậy mỗi khối tự giữ chữ gốc của nó, không phải khai lại ở hai nơi.
 */
export function heading(content: SiteContent, key: string, macDinh: string): string {
  const value = content.headings[key];
  return value && value.trim() !== "" ? value : macDinh;
}
