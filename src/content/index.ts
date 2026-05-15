import { EXTRACT_JOB_MESSAGE, extractJobFromPage } from "./extractJobPage";

// Listen for scrape requests from the popup (only reads public DOM; no APIs or login bypass).
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== EXTRACT_JOB_MESSAGE) {
    return false;
  }

  try {
    const data = extractJobFromPage();
    sendResponse({ ok: true, data });
  } catch (error) {
    console.debug("Job Tracker extraction failed:", error);
    sendResponse({
      ok: true,
      data: {
        jobTitle: document.title.trim() || "Untitled job",
        company: "",
        location: "",
        url: window.location.href,
        extractionMethod: "fallback" as const
      }
    });
  }

  return true;
});

console.debug("Job Tracker content script ready on", window.location.href);
