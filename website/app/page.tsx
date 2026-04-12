import type { Metadata } from "next";
import { Navbar } from "@/components/sections/navbar";
import { Hero } from "@/components/sections/hero";
import { Features } from "@/components/sections/features";
import { OpenSource } from "@/components/sections/open-source";
import { Footer } from "@/components/sections/footer";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://mailfleet.vercel.app",
  },
};

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MailFleet",
    applicationCategory: "BusinessApplication",
    operatingSystem: "macOS",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description:
      "Open-source desktop email campaign manager. Send campaigns via AWS SES with no monthly fees and full data ownership.",
    url: "https://mailfleet.vercel.app",
    downloadUrl: "https://github.com/abderrahimghazali/mailfleet/releases",
    license: "https://opensource.org/licenses/MIT",
    author: {
      "@type": "Person",
      name: "Abderrahim Ghazali",
      url: "https://github.com/abderrahimghazali",
    },
    softwareVersion: "1.0",
    screenshot: "https://mailfleet.vercel.app/screenshot.png",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function Home() {
  return (
    <>
      <JsonLd />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <OpenSource />
      </main>
      <Footer />
    </>
  );
}
