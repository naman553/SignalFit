export type ResumeInput = {
  id: string;
  label: string;
  text: string;
};

export type MatchStatus = {
  isMatching: boolean;
  semanticProvider: string;
  fallbackReason: string | null;
};
