# MailFleet

<p align="center">
  <img src="src-tauri/icons/icon.png" alt="MailFleet" width="128" height="128">
  <br>
  <strong>MailFleet</strong>
</p>

<p align="center">
  <a href="https://github.com/abderrahimghazali/mailfleet"><img src="https://img.shields.io/badge/Open%20Source-%E2%9D%A4%EF%B8%8F-blue" alt="Open Source"></a>
  <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Built%20with-Tauri%202-24C8D8?logo=tauri&logoColor=white" alt="Built with Tauri"></a>
  <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-61DAFB?logo=react&logoColor=white" alt="Frontend"></a>
  <a href="https://www.rust-lang.org/"><img src="https://img.shields.io/badge/Backend-Rust-DEA584?logo=rust&logoColor=white" alt="Backend"></a>
  <a href="https://aws.amazon.com/ses/"><img src="https://img.shields.io/badge/Email-AWS%20SES%20v2-FF9900?logo=amazonaws&logoColor=white" alt="AWS SES"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License"></a>
</p>

<p align="center">
  <a href="https://github.com/abderrahimghazali/mailfleet/actions/workflows/lint.yml"><img src="https://github.com/abderrahimghazali/mailfleet/actions/workflows/lint.yml/badge.svg" alt="Lint"></a>
  <a href="https://github.com/abderrahimghazali/mailfleet/releases/latest"><img src="https://img.shields.io/github/v/release/abderrahimghazali/mailfleet?label=Latest%20Release&color=brightgreen" alt="Latest Release"></a>
  <a href="https://github.com/abderrahimghazali/mailfleet/stargazers"><img src="https://img.shields.io/github/stars/abderrahimghazali/mailfleet?style=flat&color=yellow" alt="Stars"></a>
  <a href="https://github.com/abderrahimghazali/mailfleet/issues"><img src="https://img.shields.io/github/issues/abderrahimghazali/mailfleet?color=orange" alt="Issues"></a>
  <img src="https://img.shields.io/badge/Platform-macOS-000?logo=apple&logoColor=white" alt="macOS">
  <img src="https://img.shields.io/badge/AI%20Powered-%F0%9F%A4%96-blueviolet" alt="AI Powered">
</p>

<p align="center">
  A desktop email campaign management application built with Tauri and React.<br>
  Manage contacts, create email templates, and send campaigns with AWS SES integration.
</p>

<p align="center">
  <a href="https://github.com/abderrahimghazali/mailfleet/releases/latest"><img src="https://img.shields.io/badge/Download-macOS_(Apple_Silicon)-000?style=for-the-badge&logo=apple&logoColor=white" alt="Download"></a>
</p>

---

<p align="center">
  <img src="https://raw.githubusercontent.com/abderrahimghazali/mailfleet/refs/heads/main/screenshot.png" alt="MailFleet Dashboard" width="800" />
</p>

---

## Features

- **Campaigns** — Create, edit, and send email campaigns with Maily.to block editor
- **Contacts** — Manage contact lists, bulk import from CSV, email validation
- **Templates** — Build reusable email templates with drag & drop, merge tags support
- **AWS SES** — Connect your AWS credentials, verify, and send at scale with rate limiting
- **Analytics** — Track delivery, opens, clicks, bounces with charts and real-time event tracking
- **Merge Tags** — Personalize emails with {{first_name}}, {{last_name}}, {{email}}
- **Auto-Unsubscribe** — CAN-SPAM/GDPR compliant unsubscribe links auto-injected
- **Auto-Suppression** — Bounced and complained contacts automatically flagged and skipped
- **AI Agent** — Built-in email marketing assistant (Anthropic, OpenAI, Claude Code, or custom provider)
- **macOS Desktop App** — Native app built with Tauri 2

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5, TailwindCSS 4, shadcn/ui |
| Routing | TanStack Router (file-based) |
| Tables | TanStack Table |
| Editor | Maily.to (Tiptap-based block editor) |
| Charts | Recharts (shadcn/ui charts) |
| Backend | Rust, Tauri 2 |
| Email | AWS SES v2 SDK |
| Tracking | SES + SNS + SQS event pipeline |
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

1. **Configure AWS SES** — Go to Settings, follow the setup guide, enter your credentials, and click "Test Connection"
2. **Enable Tracking** — In Settings, click "Enable Tracking" to set up open/click/bounce event tracking
3. **Create Contacts** — Navigate to Contacts, create a list, and add contacts manually or import from CSV
4. **Validate Emails** — Use the email validation tool to check format, MX records, and detect disposable addresses
5. **Design Templates** — Create reusable email templates with the block editor and merge tags
6. **Launch Campaigns** — Create a campaign, assign contact lists, compose content, and send
7. **Track Results** — View delivery, open, click, and bounce analytics with charts

## Contributing

Found a bug or have an idea? We'd love to hear from you:

- [Report a Bug](https://github.com/abderrahimghazali/mailfleet/issues/new?template=bug_report.yml)
- [Request a Feature](https://github.com/abderrahimghazali/mailfleet/issues/new?template=feature_request.yml)
- [Get Support](https://github.com/abderrahimghazali/mailfleet/issues/new?template=support.yml)

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
