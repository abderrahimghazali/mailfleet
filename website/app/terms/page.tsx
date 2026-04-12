import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "MailFleet terms of service — usage terms for the MailFleet application.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-canvas text-fg">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-fg">
          Last updated: April 12, 2026
        </p>

        <div className="mt-12 space-y-10 text-muted-fg leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-fg">
              Acceptance of Terms
            </h2>
            <p className="mt-3">
              By downloading, installing, or using MailFleet, you agree to be
              bound by these terms. If you do not agree, do not use the
              application.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-fg">
              Description of Service
            </h2>
            <p className="mt-3">
              MailFleet is a free, open-source desktop application for managing
              email campaigns via AWS SES. The software is provided as-is for
              personal and commercial use.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-fg">Your Responsibilities</h2>
            <p className="mt-3">You agree to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                Comply with all applicable laws, including anti-spam regulations
                (CAN-SPAM, GDPR, etc.) when sending emails.
              </li>
              <li>
                Only send emails to recipients who have given proper consent.
              </li>
              <li>
                Maintain the security of your own AWS credentials and accounts.
              </li>
              <li>
                Use the software in a manner that does not violate AWS
                Acceptable Use Policy.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-fg">
              Intellectual Property
            </h2>
            <p className="mt-3">
              MailFleet is released under an open-source license. Please refer to
              the{" "}
              <a
                href="https://github.com/abderrahimghazali/mailfleet/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-fg underline underline-offset-4 hover:text-accent"
              >
                LICENSE
              </a>{" "}
              file in the repository for the specific terms governing the source
              code.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-fg">
              Disclaimer of Warranties
            </h2>
            <p className="mt-3">
              MailFleet is provided &quot;as is&quot; without warranty of any
              kind, express or implied. We do not guarantee that the software
              will be error-free, uninterrupted, or meet your specific
              requirements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-fg">
              Limitation of Liability
            </h2>
            <p className="mt-3">
              In no event shall the authors or contributors be liable for any
              direct, indirect, incidental, special, or consequential damages
              arising out of the use or inability to use the software, including
              but not limited to damages from email delivery failures or AWS
              service charges.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-fg">
              Changes to These Terms
            </h2>
            <p className="mt-3">
              We may update these terms from time to time. Changes will be posted
              on this page with an updated revision date. Continued use of
              MailFleet after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-fg">Contact</h2>
            <p className="mt-3">
              For questions about these terms, please open an issue on our{" "}
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
