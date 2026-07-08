import { ChevronRight, Sparkles } from "lucide-react";
import type { MatchResult } from "../matching";

type ScoreboardProps = {
  results: MatchResult[];
  selectedId?: string;
  onSelect: (id: string) => void;
};

export function Scoreboard({ results, selectedId, onSelect }: ScoreboardProps) {
  return (
    <section className="scoreboard" id="matching">
      <div className="section-heading">
        <div>
          <p className="label">Ranking</p>
          <h2>Match order</h2>
        </div>
        <span className="live-pill">
          <Sparkles size={14} />
          Live
        </span>
      </div>

      <div className="rank-list">
        {results.map((result, index) => (
          <button
            type="button"
            className={`rank-row ${result.id === selectedId ? "active" : ""}`}
            key={result.id}
            onClick={() => onSelect(result.id)}
          >
            <span className="rank-number">{index + 1}</span>
            <span className="rank-main">
              <strong>{result.label}</strong>
              <small>{result.summary}</small>
            </span>
            <span className="score">{result.score}</span>
            <ChevronRight size={17} />
          </button>
        ))}
      </div>
    </section>
  );
}
