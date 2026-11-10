import type { Metadata, Viewport } from "next";
import { Figtree, Gloock } from "next/font/google";
import { SmoothScroll } from "@/components/ui/smooth-scroll";
import { site } from "@/lib/site";
import "./globals.css";

const gloock = Gloock({
  variable: "--font-gloock",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: `${site.name} | Personal cards and sung songs for every occasion`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { title: site.name, description: site.description, type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#13233f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${gloock.variable} ${figtree.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
