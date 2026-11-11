import type { Metadata } from "next";
import { BootcampForm } from "@/components/ui/bootcamp-form";

export const metadata: Metadata = {
  title: "Free AI engineering bootcamp",
  description:
    "Register for Giftpost's free AI engineering bootcamp: learn to build AI apps and agents, step by step.",
};

export default function BootcampPage() {
  return (
    <div className="bg-snow text-ink">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1fr_1.1fr] md:py-20">
        <div>
          <h1 className="font-display text-5xl leading-tight sm:text-6xl">
            Free AI engineering bootcamp
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">
            Learn to build real AI apps and agents the way Giftpost was built: plan it, give the AI
            a rulebook, build in small tested steps, and ship it.
          </p>
          <ul className="mt-6 max-w-xl space-y-2 text-ink-muted">
            <li>Free to join.</li>
            <li>For beginners and developers alike.</li>
            <li>Register now and we&rsquo;ll email you the dates and joining details.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-line-snow bg-white/60 p-6 sm:p-8">
          <h2 className="font-display text-3xl">Register your place</h2>
          <div className="mt-6">
            <BootcampForm />
          </div>
        </div>
      </div>
    </div>
  );
}
