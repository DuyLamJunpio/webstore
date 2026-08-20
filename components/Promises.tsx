import { promises } from "@/lib/data";
import { promiseIcons } from "./icons";

export default function Promises() {
  return (
    <section id="promises" className="shell section">
      <div className="rounded-block bg-cream-dark/80 border border-line px-6 py-10 sm:px-10 md:py-14 xl:px-16 shadow-xs">
        <div className="text-center">
          <span className="eyebrow text-gold">Cam Kết Chất Lượng</span>
          <h2 className="mt-2 font-serif text-[clamp(2rem,3.6vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.015em] text-ink">
            Mua sắm thảnh thơi & an tâm
          </h2>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {promises.map((item) => {
            const Icon = promiseIcons[item.icon];
            return (
              <div
                key={item.title}
                className="group flex flex-col rounded-2xl bg-surface p-6 ring-1 ring-line shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-1"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-cream text-gold-deep transition-colors group-hover:bg-gold group-hover:text-cream">
                  <Icon />
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

