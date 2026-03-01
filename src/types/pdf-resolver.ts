// Shared types for the PDF resolver — used by both Next.js API routes and the worker.

export interface PaperInput {
  title: string;
  authors: string[];
  year: number;
  doi?: string;
  landing_url: string;
  source?: string;
}

export type ResolveStatus =
  | "DOWNLOADED"
  | "FOUND_LINK_ONLY"
  | "NO_PUBLIC_PDF"
  | "FAILED";

export interface ResolveOutput {
  status: ResolveStatus;
  pdf_url: string | null;
  final_url: string | null;
  file_path: string | null;
  reason: string | null;
  evidence: {
    method: "unpaywall" | "meta_tag" | "html_link" | "headless_click" | null;
    matched_selector_or_tag: string | null;
  };
}
