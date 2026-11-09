import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "outline-night" | "outline-snow";

const variants: Record<Variant, string> = {
  primary: "bg-ember text-night hover:bg-ember-strong",
  "outline-night":
    "border border-frost-muted/60 text-frost hover:border-frost hover:bg-night-raised",
  "outline-snow": "border border-ink/30 text-ink hover:border-ink hover:bg-white",
};

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant };

/** A link styled as a button. Use for navigation CTAs; use <button> for actions. */
export function ButtonLink({ variant = "primary", className = "", ...props }: ButtonLinkProps) {
  return (
    <Link
      className={`inline-flex min-h-12 items-center justify-center rounded-full px-6 text-base font-semibold transition-colors ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
