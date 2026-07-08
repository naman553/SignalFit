import { Brain } from "lucide-react";

export function TopNav() {
  return (
    <nav className="top-nav">
      <a className="brand" href="#top" aria-label="SignalFit home">
        <span className="brand-mark">
          <Brain size={16} />
        </span>
        SignalFit
      </a>
      <div className="nav-links">
        <a href="#matching">Matching</a>
        <a href="#explainability">Explainability</a>
        <a href="#workflow">Workflow</a>
      </div>
    </nav>
  );
}
