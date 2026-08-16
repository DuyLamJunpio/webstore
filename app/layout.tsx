import type { Metadata } from "next";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import AnnouncementBar from "@/components/AnnouncementBar";
import CartDrawer from "@/components/CartDrawer";
import FloatingContact from "@/components/FloatingContact";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import "./globals.css";

/**
 * Cả hai font đều phải khai `subsets: ["latin", "vietnamese"]`.
 *
 * Trước đây trang dùng General Sans và Playfair nạp từ `public/fonts/` — nhưng
 * đó là bản subset chỉ có Latin cơ bản: thiếu ệ ữ ự ộ ặ ơ ư, riêng Playfair
 * thiếu cả đ/Đ. Trình duyệt phải mượn glyph của font hệ thống cho từng ký tự
 * thiếu, nên giữa một từ có hai kiểu chữ và dấu rơi sai chỗ: "về" thành "vê`",
 * "mẫu" thành "mâũ", "KẾT NỐI" thành "KÊT NÔ1".
 *
 * Be Vietnam Pro thay cho General Sans vì General Sans không có bản nào hỗ trợ
 * tiếng Việt (đã đối chiếu với chính file gốc trên Fontshare). Be Vietnam Pro
 * được vẽ riêng cho tiếng Việt nên dấu nằm đúng chỗ thay vì chồng máy móc.
 */
const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// font serif dùng cho monogram và chữ ký thương hiệu TBC — vẫn đúng typeface cũ,
// chỉ khác là bản của Google có kèm subset tiếng Việt
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  // gốc tuyệt đối cho các URL og:image ở trang sản phẩm
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "The Basic Concept — Đơn giản. Hằng ngày. Cho tất cả.",
    template: "%s — The Basic Concept",
  },
  description:
    "Những món đồ mùa mới cho sự tự tin mỗi ngày. Áo khoác, đồ len và đồ cơ bản cho nam, nữ và trẻ em.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${beVietnam.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AnnouncementBar />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <FloatingContact />
      </body>
    </html>
  );
}
