export type ParsedProfile = {
  label: string;
  rawText: string;
  tokens: string[];
  vector: number[];
  skills: SkillHit[];
  seniority: SenioritySignal;
  years: number | null;
  industries: string[];
  evidence: string[];
};

export type SkillHit = {
  name: string;
  category: SkillCategory;
  aliases: string[];
};

export type SkillCategory =
  | "Engineering"
  | "Data"
  | "Product"
  | "Design"
  | "Operations"
  | "Leadership";

export type SenioritySignal = "entry" | "mid" | "senior" | "lead" | "executive";

export type MatchResult = {
  id: string;
  label: string;
  score: number;
  confidence: number;
  semanticProvider: string;
  contributions: ScoreContribution[];
  matchedSkills: SkillHit[];
  missingSkills: SkillHit[];
  matchedEvidence: string[];
  gaps: string[];
  summary: string;
};

export type ScoreContribution = {
  label: string;
  score: number;
  max: number;
  detail: string;
};

type SkillDefinition = {
  name: string;
  category: SkillCategory;
  aliases: string[];
};

const VECTOR_SIZE = 192;
const DEFAULT_SEMANTIC_PROVIDER = "local-hashed";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "our",
  "that",
  "the",
  "their",
  "to",
  "with",
  "you",
  "your",
]);

const SKILL_LIBRARY: SkillDefinition[] = [
  { name: "React", category: "Engineering", aliases: ["react", "react.js", "reactjs"] },
  { name: "TypeScript", category: "Engineering", aliases: ["typescript", "ts"] },
  { name: "JavaScript", category: "Engineering", aliases: ["javascript", "node", "node.js"] },
  { name: "Python", category: "Engineering", aliases: ["python", "django", "flask", "fastapi"] },
  { name: "API design", category: "Engineering", aliases: ["api", "rest", "graphql", "grpc"] },
  { name: "Cloud infrastructure", category: "Engineering", aliases: ["aws", "gcp", "azure", "cloud"] },
  { name: "Distributed systems", category: "Engineering", aliases: ["distributed systems", "microservices", "event driven"] },
  { name: "Machine learning", category: "Data", aliases: ["machine learning", "ml", "modeling", "classification"] },
  { name: "Embeddings", category: "Data", aliases: ["embedding", "embeddings", "vector search", "semantic search"] },
  { name: "NLP", category: "Data", aliases: ["nlp", "natural language", "language model", "llm"] },
  { name: "SQL", category: "Data", aliases: ["sql", "postgres", "mysql", "snowflake", "bigquery"] },
  { name: "Analytics", category: "Data", aliases: ["analytics", "metrics", "experimentation", "a/b"] },
  { name: "Product strategy", category: "Product", aliases: ["product strategy", "roadmap", "prioritization"] },
  { name: "User research", category: "Product", aliases: ["user research", "customer discovery", "interviews"] },
  { name: "UX design", category: "Design", aliases: ["ux", "user experience", "figma", "prototyping"] },
  { name: "Design systems", category: "Design", aliases: ["design system", "component library", "tokens"] },
  { name: "Recruiting operations", category: "Operations", aliases: ["recruiting", "talent", "ats", "hiring"] },
  { name: "Process design", category: "Operations", aliases: ["process", "workflow", "automation"] },
  { name: "Stakeholder management", category: "Leadership", aliases: ["stakeholder", "cross-functional", "executive"] },
  { name: "Team leadership", category: "Leadership", aliases: ["led team", "managed", "mentored", "hiring manager"] },
];

const INDUSTRY_SIGNALS = [
  "fintech",
  "healthcare",
  "hrtech",
  "developer tools",
  "saas",
  "marketplace",
  "ecommerce",
  "security",
  "education",
  "ai",
];

export type RankOptions = {
  jobVector?: number[];
  resumeVectors?: Record<string, number[]>;
  semanticProvider?: string;
};

export function parseProfile(text: string, fallbackLabel: string, vector?: number[]): ParsedProfile {
  const cleanText = normalizeWhitespace(text);
  const tokens = tokenize(cleanText);

  return {
    label: inferLabel(cleanText, fallbackLabel),
    rawText: cleanText,
    tokens,
    vector: vector ?? embed(tokens),
    skills: extractSkills(cleanText),
    seniority: inferSeniority(cleanText),
    years: inferYears(cleanText),
    industries: INDUSTRY_SIGNALS.filter((industry) => includesLoose(cleanText, industry)),
    evidence: extractEvidence(cleanText),
  };
}

export function rankMatches(
  jobText: string,
  resumes: Array<{ id: string; text: string; label?: string }>,
  options: RankOptions = {},
): MatchResult[] {
  const job = parseProfile(jobText, "Job description", options.jobVector);
  const jobSkillNames = new Set(job.skills.map((skill) => skill.name));
  const semanticProvider = options.semanticProvider ?? DEFAULT_SEMANTIC_PROVIDER;

  return resumes
    .filter((resume) => resume.text.trim().length > 0)
    .map((resume, index) => {
      const profile = parseProfile(resume.text, resume.label || `Candidate ${index + 1}`, options.resumeVectors?.[resume.id]);
      const semanticRaw = cosine(job.vector, profile.vector);
      const semanticScore = clamp(semanticRaw, 0, 1) * 36;

      const matchedSkills = profile.skills.filter((skill) => jobSkillNames.has(skill.name));
      const missingSkills = job.skills.filter((skill) => !profile.skills.some((candidateSkill) => candidateSkill.name === skill.name));
      const skillScore = job.skills.length ? (matchedSkills.length / job.skills.length) * 30 : 18;

      const seniorityScore = scoreSeniority(job, profile) * 14;
      const evidenceScore = scoreEvidence(job, profile) * 12;
      const industryScore = scoreIndustry(job, profile) * 8;

      const contributions: ScoreContribution[] = [
        {
          label: "Semantic alignment",
          score: roundOne(semanticScore),
          max: 36,
          detail: "Embedding similarity between the job language and resume language.",
        },
        {
          label: "Skill coverage",
          score: roundOne(skillScore),
          max: 30,
          detail: `${matchedSkills.length} of ${job.skills.length || "available"} priority skills detected.`,
        },
        {
          label: "Seniority fit",
          score: roundOne(seniorityScore),
          max: 14,
          detail: describeSeniority(job.seniority, profile.seniority, profile.years),
        },
        {
          label: "Evidence strength",
          score: roundOne(evidenceScore),
          max: 12,
          detail: "Rewards resumes with measurable outcomes, ownership, launches, or production impact.",
        },
        {
          label: "Domain overlap",
          score: roundOne(industryScore),
          max: 8,
          detail: describeIndustry(job.industries, profile.industries),
        },
      ];

      const total = contributions.reduce((sum, part) => sum + part.score, 0);
      const confidence = calculateConfidence(job, profile, matchedSkills.length);

      return {
        id: resume.id,
        label: profile.label,
        score: Math.round(total),
        confidence,
        semanticProvider,
        contributions,
        matchedSkills,
        missingSkills: missingSkills.slice(0, 8),
        matchedEvidence: pickEvidence(profile, job).slice(0, 5),
        gaps: buildGaps(job, profile, missingSkills, semanticRaw),
        summary: buildSummary(profile, matchedSkills, missingSkills, semanticRaw),
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function createLocalEmbedding(text: string): number[] {
  return embed(tokenize(text));
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function embed(tokens: string[]): number[] {
  const vector = new Array(VECTOR_SIZE).fill(0);
  const features = [...tokens, ...bigrams(tokens)];

  for (const feature of features) {
    const index = Math.abs(hash(feature)) % VECTOR_SIZE;
    vector[index] += feature.includes(" ") ? 1.35 : 1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
}

function bigrams(tokens: string[]): string[] {
  const pairs: string[] = [];
  for (let index = 0; index < tokens.length - 1; index += 1) {
    pairs.push(`${tokens[index]} ${tokens[index + 1]}`);
  }
  return pairs;
}

function cosine(a: number[], b: number[]): number {
  return a.reduce((sum, value, index) => sum + value * b[index], 0);
}

function hash(value: string): number {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result << 5) - result + value.charCodeAt(index);
    result |= 0;
  }
  return result;
}

function extractSkills(text: string): SkillHit[] {
  const hits = new Map<string, SkillHit>();
  for (const skill of SKILL_LIBRARY) {
    if (skill.aliases.some((alias) => includesLoose(text, alias))) {
      hits.set(skill.name, skill);
    }
  }
  return Array.from(hits.values());
}

function inferSeniority(text: string): SenioritySignal {
  const lower = text.toLowerCase();
  if (/\b(chief|vp|vice president|head of|director)\b/.test(lower)) return "executive";
  if (/\b(staff|principal|lead|manager|architect)\b/.test(lower)) return "lead";
  if (/\b(senior|sr\.?|expert)\b/.test(lower)) return "senior";
  if (/\b(junior|associate|entry|intern)\b/.test(lower)) return "entry";
  return "mid";
}

function inferYears(text: string): number | null {
  const matches = Array.from(text.matchAll(/(\d{1,2})\+?\s*(?:years|yrs)/gi));
  if (matches.length === 0) return null;
  return Math.max(...matches.map((match) => Number(match[1])));
}

function scoreSeniority(job: ParsedProfile, profile: ParsedProfile): number {
  const order: SenioritySignal[] = ["entry", "mid", "senior", "lead", "executive"];
  const difference = Math.abs(order.indexOf(job.seniority) - order.indexOf(profile.seniority));
  const yearsBonus = profile.years && job.years ? Math.min(profile.years / Math.max(job.years, 1), 1) * 0.18 : 0;
  return clamp(1 - difference * 0.22 + yearsBonus, 0.2, 1);
}

function scoreEvidence(job: ParsedProfile, profile: ParsedProfile): number {
  const numericEvidence = profile.evidence.filter((item) => /\d|%|\$|million|reduced|increased|launched|scaled/i.test(item)).length;
  const matchedEvidence = pickEvidence(profile, job).length;
  return clamp((numericEvidence * 0.18 + matchedEvidence * 0.16), 0.22, 1);
}

function scoreIndustry(job: ParsedProfile, profile: ParsedProfile): number {
  if (job.industries.length === 0) return 0.65;
  const overlap = profile.industries.filter((industry) => job.industries.includes(industry)).length;
  return clamp(overlap / job.industries.length, 0.15, 1);
}

function calculateConfidence(job: ParsedProfile, profile: ParsedProfile, matchedSkillCount: number): number {
  const dataCompleteness = clamp((job.tokens.length + profile.tokens.length) / 700, 0.35, 1);
  const signalDensity = clamp((matchedSkillCount + profile.evidence.length) / 12, 0.25, 1);
  return Math.round((dataCompleteness * 0.55 + signalDensity * 0.45) * 100);
}

function buildGaps(job: ParsedProfile, profile: ParsedProfile, missingSkills: SkillHit[], semanticRaw: number): string[] {
  const gaps: string[] = [];
  if (missingSkills.length > 0) {
    gaps.push(`Missing ${missingSkills.slice(0, 3).map((skill) => skill.name).join(", ")} from the job's priority signals.`);
  }
  if (scoreSeniority(job, profile) < 0.65) {
    gaps.push(`Seniority reads as ${profile.seniority}, while the job reads as ${job.seniority}.`);
  }
  if (semanticRaw < 0.45) {
    gaps.push("Resume language is not strongly aligned with the job description's core responsibilities.");
  }
  if (profile.evidence.length < 3) {
    gaps.push("Limited measurable impact evidence; stronger metrics would improve confidence.");
  }
  return gaps.length ? gaps : ["No major gaps surfaced from the parsed signals."];
}

function buildSummary(profile: ParsedProfile, matchedSkills: SkillHit[], missingSkills: SkillHit[], semanticRaw: number): string {
  const matched = matchedSkills.slice(0, 3).map((skill) => skill.name).join(", ");
  const missingList = missingSkills.slice(0, 2).map((skill) => skill.name);
  const missing = missingList.join(", ");
  const needsVerb = missingList.length === 1 ? "needs" : "need";
  const alignment = semanticRaw > 0.62 ? "strong" : semanticRaw > 0.42 ? "credible" : "partial";

  if (matched && missing) {
    return `${profile.label} shows ${alignment} alignment with clear evidence around ${matched}, though ${missing} still ${needsVerb} validation.`;
  }
  if (matched) {
    return `${profile.label} shows ${alignment} alignment with the strongest overlap around ${matched}.`;
  }
  return `${profile.label} has ${alignment} semantic alignment, but few explicit priority skills were detected.`;
}

function pickEvidence(profile: ParsedProfile, job: ParsedProfile): string[] {
  const jobTokens = new Set(job.tokens);
  return profile.evidence
    .map((item) => ({
      item,
      overlap: tokenize(item).filter((token) => jobTokens.has(token)).length,
    }))
    .sort((a, b) => b.overlap - a.overlap)
    .filter((entry) => entry.overlap > 0 || /\d|%|\$|launched|owned|led|built/i.test(entry.item))
    .map((entry) => entry.item);
}

function extractEvidence(text: string): string[] {
  return normalizeWhitespace(text)
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 28)
    .filter((sentence) => /\d|%|\$|launched|built|owned|led|managed|improved|reduced|increased|scaled|designed|implemented/i.test(sentence))
    .slice(0, 10);
}

function inferLabel(text: string, fallbackLabel: string): string {
  const firstUsefulLine = text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 2 && line.length < 70 && !/@|http|www|\d{3}/.test(line));

  return firstUsefulLine || fallbackLabel;
}

function describeSeniority(jobLevel: SenioritySignal, candidateLevel: SenioritySignal, years: number | null): string {
  const yearsText = years ? ` with ${years}+ years detected` : "";
  return `Job reads ${jobLevel}; resume reads ${candidateLevel}${yearsText}.`;
}

function describeIndustry(jobIndustries: string[], profileIndustries: string[]): string {
  if (jobIndustries.length === 0) return "No strong domain requirement detected in the job text.";
  const overlap = profileIndustries.filter((industry) => jobIndustries.includes(industry));
  return overlap.length ? `Shared domain signals: ${overlap.join(", ")}.` : "No explicit shared domain signal detected.";
}

function includesLoose(text: string, needle: string): boolean {
  const lower = text.toLowerCase();
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, "i").test(lower);
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
