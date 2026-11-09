import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <main
      id="main"
      className="mx-auto flex max-w-2xl flex-1 flex-col justify-center px-4 py-24 sm:px-6"
    >
      <h1 className="font-display text-5xl text-frost">This page isn&rsquo;t here</h1>
      <p className="mt-4 text-lg text-frost-muted">
        The link may be old, or the page hasn&rsquo;t been built yet. Head back to the home page to
        find cards, lyrics and the shop.
      </p>
      <div className="mt-8">
        <ButtonLink href="/">Go to the home page</ButtonLink>
      </div>
    </main>
  );
}
