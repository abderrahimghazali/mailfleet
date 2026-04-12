import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "MailFleet privacy policy — how we handle your data and protect your privacy.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-canvas text-fg">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-fg">
          Last updated: April 12, 2026
        </p>

        <div className="mt-12 space-y-10 text-muted-fg leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-fg">Overview</h2>
            <p className="mt-3">
              MailFleet is a desktop application that runs entirely on your
              machine. We are committed to protecting your privacy and being
              transparent about how we handle data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-fg">
              Data We Do Not Collect
            </h2>
            <p className="mt-3">
              MailFleet does not collect, store, or transmit any personal data to
              our servers. Your email lists, campaigns, templates, and AWS
              credentials remain on your local machine at all times.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-fg">Local Storage</h2>
            <p className="mt-3">
              All application data — including contacts, campaign history, and
              settings — is stored locally on your device. You have full control
              over this data and can delete it at any time by removing the
              application.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-fg">
              Third-Party Services
            </h2>
            <p className="mt-3">
              MailFleet connects to AWS Simple Email Service (SES) using
              credentials you provide. These credentials are stored locally and
              are only used to send emails on your behalf. We do not have access
              to your AWS account or credentials.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-fg">
              Website Analytics
            </h2>
            <p className="mt-3">
              This website may use basic, privacy-respecting analytics to
              understand traffic patterns. No personally identifiable information
              is collected through the website.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-fg">Open Source</h2>
            <p className="mt-3">
              MailFleet is open source. You can inspect the full source code on{" "}
              <a
                href="https://github.com/abderrahimghazali/mailfleet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-fg underline underline-offset-4 hover:text-accent"
              >
                GitHub
              </a>{" "}
              to verify our privacy practices.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-fg">Contact</h2>
            <p className="mt-3">
              If you have questions about this privacy policy, please open an
              issue on our{" "}
              <a
                href="https://github.com/abderrahimghazali/mailfleet/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-fg underline underline-offset-4 hover:text-accent"
              >
                GitHub repository
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-16">
          <Link
            href="/"
            className="text-sm text-muted-fg transition-colors hover:text-fg"
          >
            &larr; Back to home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
