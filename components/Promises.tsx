import { promises } from "@/lib/data";
import { promiseIcons } from "./icons";

export default function Promises() {
  return (
    <section id="promises" className="shell section">
      <div className="rounded-block bg-cream-dark px-6 py-12 sm:px-10 md:py-16 xl:px-16">
        <h2 className="text-center font-serif text-[clamp(2.25rem,4vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.015em]">
          Mua sắm yên tâm
        </h2>

        <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-16">
          {promises.map((item) => {
            const Icon = promiseIcons[item.icon];
            return (
              <div key={item.title} className="flex flex-col">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-surface text-gold">
                  <Icon />
                </span>
                <h3 className="mt-5 text-lg font-medium">{item.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
