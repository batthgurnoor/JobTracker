# Job Tracker — Chrome Extension

**Job Tracker** — Chrome extension (MV3) built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, **Firebase Auth**, and **Cloud Firestore** for saving and organizing job applications with per-user cloud storage. Implements authenticated CRUD for job records, a content script that extracts job metadata from public DOM (LinkedIn/Indeed heuristics plus generic fallbacks), search/filter/sort in the popup, dashboard aggregates, follow-up date tracking with visual cues, and validated JSON import/export with duplicate URL handling.

## Features

- **Authentication** — Email/password sign-up, sign-in, and sign-out; Firebase config via `VITE_*` env vars.
- **Job CRUD** — List jobs from `users/{uid}/jobs`; edit title, company, location, salary, status, notes, follow-up date; delete entries; block duplicate saves by normalized URL.
- **Smart capture** — Content script reads only public HTML (meta tags, headings, common patterns); reinforced selectors for LinkedIn and Indeed; falls back to tab title and URL elsewhere.
- **Organization** — Search across title, company, location, and notes; filter by pipeline status; sort by date, company, or status.
- **Dashboard** — Totals, follow-ups due today / overdue, and counts per status.
- **Backup** — Export all jobs as UTF-8 JSON; import with validation; skips duplicates by URL.

## Tech stack

| Area | Choice |
|------|--------|
| UI | React 19, Tailwind CSS |
| Language / tooling | TypeScript, Vite |
| Extension | Chrome MV3, `@crxjs/vite-plugin` |
| Backend | Firebase Authentication, Cloud Firestore |

## Installation

1. **Clone the repo** and install dependencies:

   ```bash
   npm install
   ```

2. **Firebase** — In [Firebase Console](https://console.firebase.google.com/), create or select a project:
   - **Authentication → Sign-in method**: enable **Email/Password**.
   - **Firestore**: create a database (adjust security rules as below).

3. **Environment variables** — Copy `.env.example` to `.env` and paste your web app keys from **Project settings → General → Your apps**.

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell: `Copy-Item .env.example .env`

   Required variables: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.

4. **Build**:

   ```bash
   npm run build
   ```

   Output is written to **`dist/`**. Restart the build after changing `.env` so Vite picks up new values.

### Authorized extension origin (recommended)

After the first build, load the unpacked extension once and copy its ID from `chrome://extensions`. In Firebase **Authentication → Settings → Authorized domains**, add:

`chrome-extension://YOUR_EXTENSION_ID`

Use the full URI including `chrome-extension://`.

### Firestore rules

Restrict access so each user only touches their own documents:

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

Publish under **Firestore → Rules**.

## Load the extension in Chrome

1. Run `npm run build` (or `npm run dev` while developing).
2. Open **`chrome://extensions`**.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked**.
5. Select the **`dist`** folder inside this project.

During development you can run `npm run dev` and reload the unpacked extension when files change.

## JSON backup format

Exports download as `job-tracker-jobs-YYYY-MM-DD.json`. Imports accept either `{ "jobs": [ … ] }` or a bare array. Each job needs a valid **`url`** string; other fields align with stored jobs (`jobTitle`, `company`, `location`, `salary`, `status`, `notes`, `followUpDate`, `dateSaved`). Duplicate URLs are skipped.

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
      jobBackup.ts
      dashboardStats.ts
      fetchActiveTabJob.ts
      filterJobs.ts
      followUpDate.ts
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
        SignInForm.tsx
        JobPanel.tsx
        JobList.tsx
        JobListControls.tsx
        JobCard.tsx
        FollowUpBadge.tsx
        BackupSection.tsx
        JobEditor.tsx
        dashboard/
          DashboardSummary.tsx
          SummaryChip.tsx
          StatusBreakdown.tsx
```

## Notes

- Never commit `.env`; configuration is read via `import.meta.env` in `src/lib/firebase.ts`.
- If Firestore requests a composite index, the browser console usually links straight to the Firebase console to create it.

## Future improvements

- Social / SSO sign-in (Google, GitHub) in addition to email/password.
- Browser notifications or calendar hooks for follow-up reminders.
- Tags, custom pipelines, or saved views beyond a single status field.
- Optional dark theme and tighter accessibility pass (focus rings, contrast).
- Stronger site-specific parsers and optional manual field mapping for edge-case layouts.
- Unit tests for extraction heuristics and backup validation.
