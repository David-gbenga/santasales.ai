import { faqs } from "@/lib/site";

export function Faq() {
  return (
    <section aria-labelledby="faq-title" className="bg-night">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 md:py-28">
        <h2 id="faq-title" className="font-display text-4xl leading-tight text-frost sm:text-5xl">
          Questions people ask
        </h2>
        <div className="mt-10 divide-y divide-line-night border-y border-line-night">
          {faqs.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold text-frost [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  aria-hidden="true"
                  className="text-2xl leading-none text-ember transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pb-5 pr-8 leading-relaxed text-frost-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
