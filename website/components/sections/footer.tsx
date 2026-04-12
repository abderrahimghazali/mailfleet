import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border/50 px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-2 font-display text-lg font-semibold text-fg">
          <Image
            src="/icon.png"
            alt="MailFleet"
            width={28}
            height={28}
            className="rounded-md"
          />
          MailFleet
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-fg">
          <a
            href="https://github.com/abderrahimghazali/mailfleet"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-fg"
          >
            GitHub
          </a>
          <a
            href="https://github.com/abderrahimghazali/mailfleet/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-fg"
          >
            Releases
          </a>
          <a
            href="https://github.com/abderrahimghazali/mailfleet/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-fg"
          >
            License
          </a>
        </div>

        <p className="text-sm text-muted-fg">
          &copy; {new Date().getFullYear()} MailFleet
        </p>
      </div>
    </footer>
  );
}
