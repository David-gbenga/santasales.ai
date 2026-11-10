"use client";

import type { ReactNode } from "react";
import { track } from "@/lib/analytics";

type GalleryLinkProps = {
  itemId: string;
  href: string;
  isAffiliate: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * External store link. Logs a gallery_click (via sendBeacon, so it isn't
 * lost when the tab opens) and lets the browser follow the link normally.
 */
export function GalleryLink({ itemId, href, isAffiliate, className, children }: GalleryLinkProps) {
  const logClick = () => track("gallery_click", { refId: itemId });

  return (
    <a
      href={href}
      target="_blank"
      // No "noreferrer": some affiliate programmes use the referrer to credit the click.
      rel={isAffiliate ? "sponsored noopener" : "noopener"}
      onClick={logClick}
      onAuxClick={(e) => {
        if (e.button === 1) logClick(); // middle-click opens a tab too
      }}
      className={className}
    >
      {children}
    </a>
  );
}
