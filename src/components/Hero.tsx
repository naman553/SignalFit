import type { MatchStatus } from "../types";

type HeroProps = {
  status: MatchStatus;
};

export function Hero({ status }: HeroProps) {
  return (
    <section className="hero">
      <p className="eyebrow">Explainable resume matching</p>
      <h1>Rank candidates with evidence, not mystery scores.</h1>
      <p className="hero-copy">
        SignalFit parses resumes and job descriptions, compares semantic vectors, and reveals exactly which skills,
        seniority signals, and evidence moved each match.
      </p>
      <div className="engine-status">
        <span>{status.isMatching ? "Scoring..." : "Scoring ready"}</span>
        <span>{status.semanticProvider}</span>
        {status.fallbackReason && <span title={status.fallbackReason}>fallback active</span>}
      </div>
    </section>
  );
}
