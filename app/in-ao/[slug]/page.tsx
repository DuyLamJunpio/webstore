import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PrintStudio from "@/components/print/PrintStudio";
import { bookableBlanks, getPrintCatalogue } from "@/lib/print-catalogue";

/*
 * Kiểu params khai thẳng thay vì dùng PageProps<"/in-ao/[slug]">: bộ kiểu đó do
 * Next sinh ra lúc build, nên một route vừa thêm sẽ không có mặt trong đó cho
 * tới lần build kế tiếp — và `tsc --noEmit` báo lỗi giả suốt quãng đó.
 */
type RouteProps = { params: Promise<{ slug: string }> };

export async function generateMetadata(props: RouteProps): Promise<Metadata> {
  const { slug } = await props.params;
  const catalogue = await getPrintCatalogue();
  const blank = catalogue?.blanks.find((b) => b.slug === slug);

  if (!blank) return { title: "Không tìm thấy phôi in" };

  return {
    title: `In lên ${blank.name}`,
    description: blank.description ?? `Đặt in theo yêu cầu trên ${blank.name}.`,
  };
}

export default async function PrintStudioPage(props: RouteProps) {
  const { slug } = await props.params;
  const catalogue = await getPrintCatalogue();

  if (!catalogue) {
    return (
      <main className="shell py-20 text-center">
        <h1 className="font-serif text-3xl text-ink">Tạm ngưng nhận đơn</h1>
        <p className="measure mt-4 text-muted">
          Không kết nối được tới hệ thống báo giá. Bạn thử lại sau ít phút, hoặc nhắn tin cho shop.
        </p>
        <Link href="/in-ao" className="mt-6 inline-block text-sm font-semibold text-ink underline underline-offset-4">
          Quay lại danh sách phôi
        </Link>
      </main>
    );
  }

  // Dùng danh sách đã lọc chứ không tra thẳng `catalogue.blanks`: một phôi chưa
  // khai vùng in thì studio không dựng nổi màn hình, và 404 còn dễ hiểu hơn một
  // khung áo trống không bấm được gì.
  const blank = bookableBlanks(catalogue).find((b) => b.slug === slug);
  if (!blank) notFound();

  return <PrintStudio catalogue={catalogue} blank={blank} />;
}
