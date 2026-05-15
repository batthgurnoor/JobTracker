/** Job fields read from the active page DOM (content script). */
export interface ExtractedJobPage {
  jobTitle: string;
  company: string;
  location: string;
  url: string;
  /** How the data was resolved (for debugging / UI hints). */
  extractionMethod: "linkedin" | "indeed" | "generic" | "fallback";
}
