import { ArrowRight, BarChart3, Check, FileText, Info } from "lucide-react";
import type { MatchResult } from "../matching";
import { InsightList } from "./InsightList";

type ExplanationProps = {
  result: MatchResult;
};

export function Explanation({ result }: ExplanationProps) {
  return (
    <section className="explanation" id="explainability">
      <div className="explanation-top">
        <div>
          <p className="label">Selected candidate</p>
          <h2>{result.label}</h2>
          <span className="provider-line">{result.semanticProvider}</span>
        </div>
        <div className="hero-score">
          <span>{result.score}</span>
          <small>{result.confidence}% confidence</small>
        </div>
      </div>

      <p className="summary">{result.summary}</p>

      <div className="contributions">
        {result.contributions.map((part) => (
          <div className="metric" key={part.label}>
            <div className="metric-head">
              <span>{part.label}</span>
              <strong>
                {part.score}/{part.max}
              </strong>
            </div>
            <div className="bar" aria-hidden="true">
              <span style={{ width: `${(part.score / part.max) * 100}%` }} />
            </div>
            <p>{part.detail}</p>
          </div>
        ))}
      </div>

      <div className="insight-grid">
        <InsightList
          icon={<Check size={16} />}
          title="Matched signals"
          items={result.matchedSkills.map((skill) => `${skill.name} - ${skill.category}`)}
          empty="No explicit skill overlap detected."
        />
        <InsightList
          icon={<Info size={16} />}
          title="Potential gaps"
          items={result.gaps}
          empty="No major gaps detected."
        />
      </div>

      <section className="evidence">
        <div className="section-heading slim">
          <div>
            <p className="label">Evidence</p>
            <h3>Resume excerpts that influenced the score</h3>
          </div>
          <FileText size={18} />
        </div>
        {result.matchedEvidence.length > 0 ? (
          result.matchedEvidence.map((item) => (
            <p className="quote" key={item}>
              {item}
            </p>
          ))
        ) : (
          <p className="muted">No strong evidence sentences found. Add measurable impact to improve explainability.</p>
        )}
      </section>

      <section className="engine-note" id="workflow">
        <BarChart3 size={18} />
        <p>
          Score = semantic alignment + skill coverage + seniority fit + evidence strength + domain overlap. Each component is
          visible so recruiters can audit the ranking before acting on it.
        </p>
        <ArrowRight size={18} />
      </section>
    </section>
  );
}
