# Job Tracker Extension

A Chrome Extension (Manifest V3) built with React, TypeScript, Vite, Tailwind CSS, Firebase Authentication, and Cloud Firestore.  
It lets people sign in with email/password and save job applications under their own account.

## Features

### Authentication (Phase 2)

- Email/password sign-up, sign-in, and sign-out
- Firebase config via Vite env vars (see `.env.example`)

### Smart save from job pages (Phase 4)

- Content script reads public DOM only (no APIs, no login bypass)
- Extracts job title, company, and location using meta tags, headings, and common class names
- Extra selectors for LinkedIn and Indeed; falls back to `document.title` + tab URL on any site
- Popup **Refresh from current tab** pre-fills the save form; your edits are kept on save

### Search, filter, and sort (Phase 5)

- Search saved jobs by title, company, location, or notes
- Filter by status; sort by date, company name, or status
- Shows how many jobs match (`Showing X of Y jobs`)

### Job list & tracking (Phase 3)

- Loads all jobs from `users/{userId}/jobs` when you are signed in
- Job cards show title, company, location, URL, date saved, and status
- Change status in a dropdown (`Saved`, `Applied`, `Interview`, `Offer`, `Rejected`) — updates Firestore
- Delete jobs from Firestore
- Blocks duplicate saves when the same job URL already exists for your account
- Empty state: **No saved jobs yet.**
- Firestore access lives in `src/services/jobService.ts`

## Project structure

```text
job-tracker-extension/
  manifest.json
  package.json
  vite.config.ts
  tailwind.config.ts
  postcss.config.js
  tsconfig.json
  .env.example
  src/
    lib/
      firebase.ts
      fetchActiveTabJob.ts
      filterJobs.ts
      userFacingErrors.ts
    services/
      jobService.ts
    types/
      job.ts
      extractedJobPage.ts
    background/
      index.ts
    content/
      index.ts
      extractJobPage.ts
    popup/
      index.html
      main.tsx
      App.tsx
      index.css
      components/
        AuthPanel.tsx
        JobPanel.tsx
        JobList.tsx
        JobListControls.tsx
        JobCard.tsx
```

## Setup

### 1. Firebase project

1. In the [Firebase Console](https://console.firebase.google.com/), create (or choose) a project.
2. **Authentication → Sign-in method**: enable **Email/Password**.
3. **Firestore Database**: create the database (production or test mode to start — see rules below).

### 2. Registered extension ID (recommended)

Firebase keeps a tight list of origins that may use Authentication in the browser extension context.

1. Build and load the extension once (**Load unpacked** → select the built `dist` folder).
2. On `chrome://extensions`, enable **Developer mode** and copy the **Extension ID**.
3. In Firebase: **Authentication → Settings → Authorized domains → Add domain** and enter the full URI (this is what Firebase validates as the “domain” for an extension):

   `chrome-extension://YOUR_EXTENSION_ID`

   Example if your ID is `abcdefghijklmnopqrstuvwxyz`:  
   `chrome-extension://abcdefghijklmnopqrstuvwxyz`

   Paste the **whole** string including `chrome-extension://`. Typing only the 32-character ID often shows “a valid domain name is required.”

### 3. Environment variables

1. Copy `.env.example` to `.env` in the repo root.

```bash
cp .env.example .env   # macOS / Linux / Git Bash on Windows

# Windows PowerShell
Copy-Item .env.example .env
```

2. In Firebase: **Project settings → General → Your apps → Web app** (create one if needed). Paste the values into `.env`:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

3. Restart the dev server / rebuild whenever `.env` changes so Vite can embed `VITE_*` values:

```bash
npm install
npm run build
```

### 4. Firestore security rules

Use rules so each user reads/writes only their own `/users/{uid}/jobs` subtree:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/jobs/{jobId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Publish these in **Firestore → Rules**. Without them (or equivalent), saves may fail with “permission denied”.

### 5. Install, build, load in Chrome

```bash
npm install
npm run build
```

- Open `chrome://extensions`
- Turn on **Developer mode**
- Click **Load unpacked**
- Choose the **`dist`** folder from this repo

During development:

```bash
npm run dev
```

## Notes

- Config is accessed only through `import.meta.env` (see `src/lib/firebase.ts`). Do **not** commit `.env`; it stays on your machine.
- The popup pulls the active tab title/URL for `jobTitle` and `url` when you click **Save current job**; company, location, notes, and status are edited in the form.
- If Firestore ever asks for a composite index, the browser error console will include a direct link to create it in the Firebase console.
