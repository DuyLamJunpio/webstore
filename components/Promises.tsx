import { promises } from "@/lib/data";
import { promiseIcons } from "./icons";

export default function Promises() {
  return (
    <section id="promises" className="shell section">
      <div className="border border-line bg-[#f7f7f7] p-6 sm:p-10 lg:p-12">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block bg-[#e60012] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow-2xs">
            TIỆN ÍCH & DỊCH VỤ
          </span>
          <h2 className="mt-3 font-sans text-[clamp(1.75rem,3.2vw,2.75rem)] font-extrabold uppercase leading-[1.1] tracking-[-0.01em] text-ink">
            Mua sắm thảnh thơi & an tâm
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#666666]">
            Chúng tôi nỗ lực mang lại trải nghiệm mua sắm LifeWear đơn giản, tiện lợi và hài lòng nhất.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {promises.map((item) => {
            const Icon = promiseIcons[item.icon];
            return (
              <div
                key={item.title}
                className="flex flex-col border border-line bg-white p-6 transition-all hover:border-black/50"
              >
                <span className="grid h-10 w-10 place-items-center bg-[#f4f4f4] text-[#e60012]">
                  <Icon />
                </span>
                <h3 className="mt-4 text-sm font-bold uppercase tracking-wider text-ink">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#666666]">{item.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

