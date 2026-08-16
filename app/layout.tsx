import type { Metadata } from "next";
import localFont from "next/font/local";
import AnnouncementBar from "@/components/AnnouncementBar";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import "./globals.css";

const generalSans = localFont({
  variable: "--font-general-sans",
  display: "swap",
  src: [
    { path: "../public/fonts/GeneralSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/GeneralSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/GeneralSans-Semibold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/GeneralSans-Bold.woff2", weight: "700", style: "normal" },
  ],
});

// font serif dùng cho monogram và chữ ký thương hiệu TBC
const playfair = localFont({
  variable: "--font-playfair",
  display: "swap",
  src: [{ path: "../public/fonts/PlayfairDisplay-Variable.woff2", weight: "400 700", style: "normal" }],
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
      className={`${generalSans.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AnnouncementBar />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
      </body>
    </html>
  );
}
