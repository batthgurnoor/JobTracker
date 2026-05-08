# Job Tracker Extension

A Chrome Extension (Manifest V3) built with React, TypeScript, Vite, and Tailwind CSS.  
It helps users save and track job application pages from the browser popup.

## Features (Phase 1)

- Popup UI with:
  - `Job Tracker` title
  - `Save Current Job` button
  - `View Saved Jobs` button
- Saves current tab title + URL to `chrome.storage.local`
- Displays a success message after save
- Includes a content script that reads page title and URL
- Built using clean, beginner-friendly project structure

## Project Structure

```text
job-tracker-extension/
  manifest.json
  package.json
  vite.config.ts
  tailwind.config.ts
  postcss.config.js
  tsconfig.json
  src/
    background/
      index.ts
    content/
      index.ts
    popup/
      index.html
      main.tsx
      App.tsx
      index.css
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Build the extension:

```bash
npm run build
```

3. Load in Chrome:

- Open `chrome://extensions`
- Enable **Developer mode** (top-right)
- Click **Load unpacked**
- Select the generated `dist` folder from this project

## Notes

- Saved jobs are stored locally in `chrome.storage.local` under the key `savedJobs`.
- No backend is used in this phase.
