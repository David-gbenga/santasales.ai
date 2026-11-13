/** Shared layout for the sign-up, sign-in and password pages (snow theme). */
export function AuthShell({
  title,
  intro,
  children,
  footer,
}: {
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="bg-snow text-ink">
      <div className="mx-auto max-w-md px-4 py-16 sm:py-20">
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">{title}</h1>
        {intro && <div className="mt-4 text-lg leading-relaxed text-ink-muted">{intro}</div>}
        <div className="mt-8 rounded-2xl border border-line-snow bg-white/60 p-6 sm:p-8">{children}</div>
        {footer && <div className="mt-6 space-y-2 text-ink-muted">{footer}</div>}
      </div>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <p role="alert" className="mb-6 rounded-md border border-berry/50 bg-white px-4 py-3 font-medium text-berry">
      {message}
    </p>
  );
}
