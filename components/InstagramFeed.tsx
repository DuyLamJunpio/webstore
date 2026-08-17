import Image from "next/image";
import { instagramFeed } from "@/lib/data";
import SectionHeading from "./SectionHeading";
import { Instagram } from "./icons";

export default function InstagramFeed() {
  // Chưa nối Instagram thì không dựng cả khối, thay vì hiện tiêu đề rỗng.
  if (instagramFeed.length === 0) return null;

  return (
    <section id="instagram" className="shell section">
      <SectionHeading
        align="center"
        title="Theo dõi chúng tôi trên Instagram"
        subtitle="Xem cộng đồng của chúng tôi phối những món đồ yêu thích, từ đồ cơ bản hằng ngày đến hàng mới về."
      />

      <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {instagramFeed.map((item) => (
          <a
            key={item.src}
            href="#instagram"
            className="group relative aspect-3/4 overflow-hidden rounded-card bg-cream-dark"
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              className="object-cover transition-transform duration-900 ease-out group-hover:scale-[1.06]"
            />
            <span className="absolute inset-0 grid place-items-center bg-ink/45 text-gold-soft opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <Instagram className="h-6 w-6" />
            </span>
          </a>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <a
          href="#instagram"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-medium text-cream transition-transform duration-300 hover:-translate-y-0.5"
        >
          <Instagram className="h-4 w-4" />
          @thebasicconcept
        </a>
      </div>
    </section>
  );
}
