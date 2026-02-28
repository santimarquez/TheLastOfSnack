import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/AppProviders";

/** Image used in "ARE YOU READY?" CTA section – used for og:image and social previews */
const OG_IMAGE_URL =
  "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/517e2778-d4e5-4792-abae-82c773702d00/public";

const SITE_NAME = "The Last of the Snacks";
const DEFAULT_DESCRIPTION = "Trust no one. Season aggressively.";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://thelastofsnack.com"),
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "The Last of the Snacks – Are you ready?",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE_URL],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Spline+Sans:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
