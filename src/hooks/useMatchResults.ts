import { useEffect, useMemo, useState } from "react";
import { requestMatches } from "../api";
import { rankMatches, type MatchResult } from "../matching";
import type { MatchStatus, ResumeInput } from "../types";

export function useMatchResults(jobText: string, resumes: ResumeInput[]) {
  const [apiResults, setApiResults] = useState<MatchResult[] | null>(null);
  const [semanticProvider, setSemanticProvider] = useState("local-hashed");
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState(false);

  const localResults = useMemo(() => rankMatches(jobText, resumes), [jobText, resumes]);
  const results = apiResults ?? localResults;

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      if (!jobText.trim() || resumes.every((resume) => !resume.text.trim())) {
        setApiResults([]);
        return;
      }

      setIsMatching(true);
      try {
        const data = await requestMatches(jobText, resumes, controller.signal);
        setApiResults(data.results);
        setSemanticProvider(data.semanticProvider);
        setFallbackReason(data.fallbackReason ?? null);
      } catch (error) {
        if (controller.signal.aborted) return;
        setApiResults(null);
        setSemanticProvider("local-hashed");
        setFallbackReason(error instanceof Error ? error.message : "Match API unavailable.");
      } finally {
        if (!controller.signal.aborted) {
          setIsMatching(false);
        }
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [jobText, resumes]);

  const status: MatchStatus = {
    isMatching,
    semanticProvider,
    fallbackReason,
  };

  return { results, status };
}
