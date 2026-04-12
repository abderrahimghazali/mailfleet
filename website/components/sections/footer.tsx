import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/50 px-6 py-16">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-display text-lg font-semibold text-fg">
            <Image
              src="/icon.png"
              alt="MailFleet"
              width={28}
              height={28}
              loading="lazy"
              className="rounded-md"
            />
            MailFleet
          </div>
          <p className="text-sm text-muted-fg">
            Open-source desktop email client built with modern technologies.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-fg">Product</h4>
          <nav className="flex flex-col gap-2 text-sm text-muted-fg">
            <Link href="#features" className="transition-colors hover:text-fg">
              Features
            </Link>
            <Link href="#open-source" className="transition-colors hover:text-fg">
              Open Source
            </Link>
            <a
              href="https://github.com/abderrahimghazali/mailfleet/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-fg"
            >
              Downloads
            </a>
          </nav>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-fg">Resources</h4>
          <nav className="flex flex-col gap-2 text-sm text-muted-fg">
            <a
              href="https://github.com/abderrahimghazali/mailfleet"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-fg"
            >
              GitHub
            </a>
            <a
              href="https://github.com/abderrahimghazali/mailfleet#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-fg"
            >
              Documentation
            </a>
            <a
              href="https://github.com/abderrahimghazali/mailfleet/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-fg"
            >
              Changelog
            </a>
          </nav>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-fg">Legal</h4>
          <nav className="flex flex-col gap-2 text-sm text-muted-fg">
            <Link href="/privacy" className="transition-colors hover:text-fg">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-fg">
              Terms of Service
            </Link>
          </nav>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-6xl items-center justify-between border-t border-border/50 pt-8">
        <p className="text-sm text-muted-fg">
          &copy; {new Date().getFullYear()} MailFleet. All rights reserved.
        </p>
        <a
          href="https://github.com/abderrahimghazali/mailfleet"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="MailFleet on GitHub"
          className="text-muted-fg transition-colors hover:text-fg"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>
      </div>
    </footer>
  );
}
