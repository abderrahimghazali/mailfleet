# MailFleet

<p align="center">
  <img src="src-tauri/icons/icon.png" alt="MailFleet" width="128" height="128">
</p>

<p align="center">
  <a href="https://github.com/abderrahimghazali/mailfleet/actions/workflows/lint.yml"><img src="https://github.com/abderrahimghazali/mailfleet/actions/workflows/lint.yml/badge.svg" alt="Lint"></a>
  <img src="https://img.shields.io/badge/Tauri-2.0-24C8D8?logo=tauri&logoColor=white" alt="Tauri 2">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5">
  <img src="https://img.shields.io/badge/Rust-1.75+-DEA584?logo=rust&logoColor=white" alt="Rust">
  <img src="https://img.shields.io/badge/AWS_SES-v2-FF9900?logo=amazonaws&logoColor=white" alt="AWS SES">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
</p>

<p align="center">
  A desktop email campaign management application built with Tauri and React.<br>
  Manage contacts, create email templates, and send campaigns with AWS SES integration.
</p>

---

## Features

- **Campaign Management** — Create, edit, schedule, and send email campaigns with a rich WYSIWYG editor
- **Contact Lists** — Organize contacts into lists, bulk import via CSV, and manage subscribers
- **Email Templates** — Design reusable templates with the built-in HTML editor, preview, and apply to campaigns
- **AWS SES Integration** — Configure your AWS SES credentials, verify connectivity, and send emails at scale with rate limiting
- **Campaign Analytics** — Track delivery rates, opens, clicks, bounces, and unsubscribes per campaign
- **Dark Mode** — Full light/dark theme support with system preference detection
- **Data Tables** — Sortable, searchable, and paginated tables powered by TanStack Table
- **Cross-Platform** — Runs on macOS, Windows, and Linux as a native desktop app

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5, TailwindCSS 4, shadcn/ui |
| Routing | TanStack Router (file-based) |
| Tables | TanStack Table |
| Editor | Quill 2 (WYSIWYG) |
| Backend | Rust, Tauri 2 |
| Email | AWS SES v2 SDK |
| Storage | JSON file-based (portable, no database required) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://rustup.rs/) 1.75+
- Platform-specific Tauri dependencies — see [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)

### Installation

```bash
# Clone the repo
git clone https://github.com/abderrahimghazali/mailfleet.git
cd mailfleet

# Install frontend dependencies
npm install

# Run in development mode
npm run dev:tauri
```

### Build for Production

```bash
npm run build:tauri
```

The built app will be in `src-tauri/target/release/bundle/`.

## Usage

1. **Configure AWS SES** — Go to Settings and enter your AWS Access Key, Secret Key, and region. Click "Test Connection" to verify.
2. **Create Contacts** — Navigate to Contacts, create a list, and add contacts manually or import from CSV.
3. **Design Templates** — Create reusable email templates with the WYSIWYG editor.
4. **Launch Campaigns** — Create a campaign, assign contact lists, compose content (or load a template), and send.
5. **Track Results** — View delivery, open, click, and bounce analytics on the Analytics page.

## Project Structure

```
mailfleet/
├── src/                    # React frontend
│   ├── components/         # UI components (shadcn/ui)
│   ├── routes/             # TanStack Router file-based routes
│   ├── services/           # Tauri IPC service layer
│   └── types/              # TypeScript type definitions
├── src-tauri/              # Rust backend
│   └── src/
│       ├── database/       # JSON storage, models, commands
│       └── email/          # AWS SES client & campaign sender
└── .github/workflows/      # CI (ESLint, TypeScript, Clippy, Rustfmt)
```

## License

MIT
