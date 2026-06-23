# Redlineshift

A brutally simple, zero-login project management tool with Git-style versioning and temporal UI.

Redlineshift is designed to be a frictionless workspace. There are no user accounts, no passwords, and no databases to manage. It relies on a high-entropy Token for access and a secondary Passkey for destructive actions, syncing seamlessly across devices via Cloudflare KV.

## Core Features

- **Temporal UI:** The workspace background color shifts dynamically based on how close your active project is to its deadline (Red < 3 days → Green < 2 weeks → Blue < 1 month → White).
- **Logarithmic Timeline:** A custom slider allows you to dial in deadlines with high precision for the next few days, while still allowing you to schedule tasks up to a year out.
- **Block-Based Markdown:** A Notion-style editor that parses markdown on the fly (`#`, `-`, etc.), handles auto-resizing, and supports intuitive keyboard navigation to break out of lists.
- **Git-Style Snapshots:** Press `Ctrl+Enter` to commit a snapshot of your project. The built-in history viewer uses a two-pointer alignment algorithm to display precise inline diffs (additions/removals) between snapshots.
- **Zero-Login Authentication:** Access your workspace via a generated UUID Token.

## Security Architecture

Redlineshift uses a two-tier security model to prevent account hijacking while keeping daily usage frictionless:

1. **The Access Token (UUID):** Generated on workspace creation. Stored in `localStorage`. This grants read/write access to the workspace. If leaked, an attacker can read or edit projects, but they cannot lock the rightful owner out.
2. **The Passkey (PIN):** Set by the user on creation and stored strictly on the server alongside the data. It is never sent back to the client. The Passkey is strictly required to authorize destructive actions:
   - **Nuking the Workspace:** Deleting all data requires the Passkey.
   - **Rotating the Token:** If a token is compromised, the owner can provide the Passkey to generate a new Token, migrate the data, and destroy the old Token—instantly locking out the attacker.

## Tech Stack

- **Frontend:** React, Vite
- **Styling:** Tailwind CSS (v4)
- **Backend:** Cloudflare Pages Functions
- **Database:** Cloudflare KV (Key-Value storage)

## Local Development

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Run the Vite Dev Server:**

   ```bash
   npm run dev

   ```

_Note: Running locally without the Cloudflare backend will result in sync errors. You must deploy the backend or run a local Wrangler instance to test database interactions._

## Deployment Setup (Cloudflare Pages)

Redlineshift is designed to be hosted on Cloudflare Pages, utilizing Pages Functions for the API.

1. **Create a KV Namespace:**
   In your Cloudflare Dashboard, create a KV namespace named `redlineshift-store`.
2. **Connect to GitHub:**
   Create a new Pages project in Cloudflare and connect it to your GitHub repository.
3. **Configure Build:**

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`

4. **Bind KV Store:**
   Before deploying, go to **Environment variables (advanced)** -> **KV namespace bindings**. Add a binding with the variable name `STORE` and link it to your `redlineshift-store` namespace.
5. **Deploy:**
   Cloudflare will automatically compile the frontend and deploy the `functions/api/sync.js` script as your backend endpoint.
