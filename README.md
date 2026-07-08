# SignalFit

SignalFit is a resume-to-job matching engine prototype focused on explainability. It parses pasted job descriptions and resumes, ranks candidates, and shows which signals contributed to each score.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. In this workspace, the app is currently running at:

```text
http://127.0.0.1:5173/
```

The dev command starts both the React app and the API server. The API runs at:

```text
http://127.0.0.1:8787/
```

## Optional Gemini embeddings

Copy `.env.example` to `.env` and set `GEMINI_API_KEY` to use real embeddings through the server. Without a key, SignalFit automatically falls back to the deterministic local embedding engine.

```bash
GEMINI_API_KEY=your_api_key_here
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
```

Resume uploads support `.pdf`, `.docx`, `.txt`, `.md`, and `.csv`. Legacy `.doc` files should be converted to `.docx` or PDF.

## Scoring model

The current engine can use Gemini embeddings when configured, or deterministic local embeddings built from hashed token and phrase features as a fallback. The final score is composed from:

- Semantic alignment
- Skill coverage
- Seniority fit
- Evidence strength
- Domain overlap

Each ranked candidate exposes score contributions, matched skills, likely gaps, and resume evidence excerpts. The matching engine lives in `src/matching.ts`, separated from the interface so it can later be swapped to API-backed embeddings.
