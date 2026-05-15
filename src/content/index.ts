import { EXTRACT_JOB_MESSAGE, extractJobFromPage } from "./extractJobPage";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== EXTRACT_JOB_MESSAGE) {
    return false;
  }

  try {
    const data = extractJobFromPage();
    sendResponse({ ok: true, data });
  } catch {
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
