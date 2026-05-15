export interface ExtractedJobPage {
  jobTitle: string;
  company: string;
  location: string;
  url: string;
  extractionMethod: "linkedin" | "indeed" | "generic" | "fallback";
}
