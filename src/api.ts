import type { MatchResult } from "./matching";
import type { ResumeInput } from "./types";

export type MatchApiResponse = {
  results: MatchResult[];
  semanticProvider: string;
  fallbackReason?: string;
};

export type ParseApiResponse = {
  resumes: ResumeInput[];
};

export async function requestMatches(
  jobText: string,
  resumes: ResumeInput[],
  signal: AbortSignal,
): Promise<MatchApiResponse> {
  const response = await fetch("/api/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobText, resumes }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Match API returned ${response.status}`);
  }

  return response.json() as Promise<MatchApiResponse>;
}

export async function parseResumeFiles(files: FileList): Promise<ParseApiResponse> {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("files", file));

  const response = await fetch("/api/parse-resumes", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Parser API returned ${response.status}`);
  }

  return response.json() as Promise<ParseApiResponse>;
}
