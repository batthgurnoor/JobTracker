import { EXTRACT_JOB_MESSAGE } from "../content/extractJobPage";
import type { ExtractedJobPage } from "../types/extractedJobPage";

function isRestrictedUrl(url: string): boolean {
  return (
    url.startsWith("chrome://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:") ||
    url.startsWith("chrome-extension://")
  );
}

/**
 * Asks the content script on the active tab to extract job fields.
 * Falls back to tab title + URL when messaging fails (e.g. page not refreshed after install).
 */
export async function fetchExtractedJobFromActiveTab(): Promise<ExtractedJobPage | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url || isRestrictedUrl(tab.url)) {
    return null;
  }

  try {
    const response = (await chrome.tabs.sendMessage(tab.id, {
      type: EXTRACT_JOB_MESSAGE
    })) as { ok?: boolean; data?: ExtractedJobPage };

    if (response?.ok && response.data) {
      return {
        ...response.data,
        url: tab.url
      };
    }
  } catch {
    // Content script may not be loaded yet — use tab metadata only.
  }

  return {
    jobTitle: tab.title?.trim() || "Untitled job",
    company: "",
    location: "",
    url: tab.url,
    extractionMethod: "fallback"
  };
}
