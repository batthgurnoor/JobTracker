import type { ExtractedJobPage } from "../types/extractedJobPage";

const MAX_FIELD_LENGTH = 300;

/** Message type the popup sends to request a fresh scrape of the open tab. */
export const EXTRACT_JOB_MESSAGE = "JOB_TRACKER_EXTRACT_JOB" as const;

/**
 * Reads visible text from the first matching selector.
 * Skips hidden nodes and trims overly long strings.
 */
function textFromSelectors(selectors: string[]): string {
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      const text = element?.textContent?.trim();
      if (text && text.length <= MAX_FIELD_LENGTH) {
        return text;
      }
    } catch {
      // Invalid selector — try the next one.
    }
  }
  return "";
}

/** Reads Open Graph / standard meta tags (common on job boards and share cards). */
function metaContent(names: string[]): string {
  for (const name of names) {
    const byProperty = document.querySelector(`meta[property="${name}"]`)?.getAttribute("content");
    if (byProperty?.trim()) {
      return byProperty.trim().slice(0, MAX_FIELD_LENGTH);
    }
    const byName = document.querySelector(`meta[name="${name}"]`)?.getAttribute("content");
    if (byName?.trim()) {
      return byName.trim().slice(0, MAX_FIELD_LENGTH);
    }
  }
  return "";
}

/**
 * Finds an element whose id or class contains a keyword (e.g. "job-title").
 * Only checks a small set of tags to stay fast and avoid noisy matches.
 */
function textFromKeyword(keywords: string[]): string {
  const allowedTags = ["h1", "h2", "p", "span", "div", "a"];

  for (const keyword of keywords) {
    const lower = keyword.toLowerCase();
    for (const tag of allowedTags) {
      const nodes = document.querySelectorAll(tag);
      for (const node of nodes) {
        const id = node.id?.toLowerCase() ?? "";
        const className = node.className?.toString().toLowerCase() ?? "";
        if (!id.includes(lower) && !className.includes(lower)) {
          continue;
        }
        const text = node.textContent?.trim();
        if (text && text.length >= 2 && text.length <= MAX_FIELD_LENGTH) {
          return text;
        }
      }
    }
  }
  return "";
}

/** Parses "Role at Company" or "Role | Company" patterns from document.title. */
function parseTitleParts(pageTitle: string): { jobTitle: string; company: string } {
  const cleaned = pageTitle.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return { jobTitle: "", company: "" };
  }

  const atMatch = cleaned.match(/^(.+?)\s+at\s+(.+?)(?:\s*[-|·]|$)/i);
  if (atMatch) {
    return { jobTitle: atMatch[1].trim(), company: atMatch[2].trim() };
  }

  const pipeParts = cleaned.split("|").map((p) => p.trim()).filter(Boolean);
  if (pipeParts.length >= 2) {
    return { jobTitle: pipeParts[0], company: pipeParts[1] };
  }

  const dashParts = cleaned.split(" - ").map((p) => p.trim()).filter(Boolean);
  if (dashParts.length >= 2) {
    return { jobTitle: dashParts[0], company: dashParts[dashParts.length - 1] };
  }

  return { jobTitle: cleaned, company: "" };
}

/** LinkedIn public job view — selectors may change; we try several stable patterns. */
function extractLinkedIn(): Partial<ExtractedJobPage> {
  const jobTitle = textFromSelectors([
    "h1.top-card-layout__title",
    "h1.job-details-jobs-unified-top-card__job-title",
    "h1.t-24",
    ".jobs-unified-top-card__job-title",
    "h1"
  ]);

  const company = textFromSelectors([
    ".topcard__org-name-link",
    ".job-details-jobs-unified-top-card__company-name a",
    ".job-details-jobs-unified-top-card__company-name",
    "a[data-tracking-control-name='public_jobs_topcard-org-name']",
    ".jobs-unified-top-card__company-name"
  ]);

  const location = textFromSelectors([
    ".topcard__flavor--bullet",
    ".job-details-jobs-unified-top-card__bullet",
    ".jobs-unified-top-card__bullet",
    ".jobs-unified-top-card__workplace-type"
  ]);

  return { jobTitle, company, location };
}

/** Indeed job detail / view job pages. */
function extractIndeed(): Partial<ExtractedJobPage> {
  const jobTitle = textFromSelectors([
    "h1.jobsearch-JobInfoHeader-title",
    "h1[data-testid='jobsearch-JobInfoHeader-title']",
    ".jobsearch-JobInfoHeader-title",
    "h1"
  ]);

  const company = textFromSelectors([
    "[data-company-name='true']",
    ".jobsearch-InlineCompanyRating a",
    ".jobsearch-CompanyInfoWithoutHeaderImage a",
    ".jobsearch-JobInfoHeader-companyName",
    "div[data-testid='inlineHeader-companyName'] a"
  ]);

  const location = textFromSelectors([
    "[data-testid='job-location']",
    ".jobsearch-JobInfoHeader-subtitle div",
    "#jobLocationText",
    ".jobsearch-JobInfoHeader-subtitle"
  ]);

  return { jobTitle, company, location };
}

/**
 * Generic extraction for any site: meta tags, first h1, and keyword-based class/id search.
 */
function extractGeneric(): Partial<ExtractedJobPage> {
  const jobTitle =
    metaContent(["og:title", "twitter:title"]) ||
    textFromSelectors(["h1", "[itemprop='title']", "[data-testid*='job-title']"]) ||
    textFromKeyword(["job-title", "jobtitle", "position-title", "posting-title"]);

  const company =
    metaContent(["og:site_name"]) ||
    textFromSelectors([
      "[itemprop='hiringOrganization']",
      "[data-testid*='company']",
      "[class*='company-name']"
    ]) ||
    textFromKeyword(["company-name", "employer", "organization", "company"]);

  const location =
    textFromSelectors([
      "[itemprop='jobLocation']",
      "[data-testid*='location']",
      "[class*='job-location']",
      "[class*='location']"
    ]) || textFromKeyword(["job-location", "joblocation", "location"]);

  return { jobTitle, company, location };
}

function hostMatches(hostname: string, suffix: string): boolean {
  return hostname === suffix || hostname.endsWith(`.${suffix}`);
}

/**
 * Main entry: tries site-specific extractors, then generic heuristics,
 * then document.title + URL as a safe fallback (never throws).
 */
export function extractJobFromPage(): ExtractedJobPage {
  const url = window.location.href;
  const hostname = window.location.hostname.toLowerCase();
  const pageTitle = document.title.trim();

  let method: ExtractedJobPage["extractionMethod"] = "generic";
  let partial: Partial<ExtractedJobPage> = {};

  if (hostMatches(hostname, "linkedin.com")) {
    method = "linkedin";
    partial = extractLinkedIn();
  } else if (hostMatches(hostname, "indeed.com")) {
    method = "indeed";
    partial = extractIndeed();
  } else {
    partial = extractGeneric();
  }

  let jobTitle = partial.jobTitle?.trim() ?? "";
  let company = partial.company?.trim() ?? "";
  let location = partial.location?.trim() ?? "";

  // Fill gaps from document.title patterns (works on many boards).
  const fromTitle = parseTitleParts(pageTitle);
  if (!jobTitle) {
    jobTitle = fromTitle.jobTitle;
  }
  if (!company) {
    company = fromTitle.company;
  }

  // Last resort: always keep something usable for jobTitle + url.
  const usedOnlyFallbackTitle = !partial.jobTitle?.trim();
  if (!jobTitle) {
    jobTitle = pageTitle || "Untitled job";
  }
  if (usedOnlyFallbackTitle && !partial.company?.trim() && !partial.location?.trim()) {
    method = "fallback";
  }

  return {
    jobTitle,
    company,
    location,
    url,
    extractionMethod: method
  };
}
