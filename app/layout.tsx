import type { Metadata } from "next";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import CartDrawer from "@/components/CartDrawer";
import { getContent } from "@/lib/content";
import { SalesProvider } from "@/lib/sales-context";
import FloatingContact from "@/components/FloatingContact";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MobileBottomNav from "@/components/MobileBottomNav";
import "./globals.css";

/**
 * Cả hai font đều phải khai `subsets: ["latin", "vietnamese"]`.
 */
const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "The Basic Concept — Đơn giản. Hằng ngày. Cho tất cả.",
    template: "%s — The Basic Concept",
  },
  description:
    "Những món đồ mùa mới cho sự tự tin mỗi ngày. Áo khoác, đồ len và đồ cơ bản cho nam, nữ và trẻ em.",
  icons: {
    icon: [
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { sales } = await getContent();

  return (
    <html
      lang="vi"
      className={`${beVietnam.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <SalesProvider value={sales}>
          <Header />
          <main className="flex-1 pb-16 lg:pb-0">{children}</main>
          <Footer />
          <CartDrawer />
          <FloatingContact />
          <MobileBottomNav />
        </SalesProvider>
      </body>
    </html>
  );
}

