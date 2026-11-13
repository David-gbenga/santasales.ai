import { Suspense } from "react";
import { ConciergeLauncher } from "@/components/concierge/concierge-launcher";
import { SiteFooter } from "@/components/sections/site-footer";
import { SiteHeader } from "@/components/sections/site-header";
import { PageViewTracker } from "@/components/ui/page-view-tracker";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      {/* Susan, the gift concierge, on every page of the site. */}
      {/* Reads the page path; dynamic pages need it inside Suspense. */}
      <Suspense fallback={null}>
        <ConciergeLauncher />
      </Suspense>
      {/* The tracker reads the URL; on request-time routes that must sit inside Suspense. */}
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
