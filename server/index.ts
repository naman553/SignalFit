import "dotenv/config";
import cors from "cors";
import express from "express";
import multer from "multer";
import { embedTexts } from "./embeddingService";
import { parseResumeFile } from "./fileParser";
import { rankMatches } from "../src/matching";

const app = express();
const port = Number(process.env.PORT || 8787);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 20,
  },
});

app.use(cors({ origin: ["http://127.0.0.1:5173", "http://localhost:5173"] }));
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    embeddings: process.env.GEMINI_API_KEY ? "gemini" : "local-fallback",
  });
});

app.post("/api/match", async (request, response, next) => {
  try {
    const { jobText, resumes } = request.body as {
      jobText?: string;
      resumes?: Array<{ id: string; label?: string; text: string }>;
    };

    if (!jobText?.trim()) {
      response.status(400).json({ error: "Job description is required." });
      return;
    }

    const validResumes = (resumes ?? []).filter((resume) => resume.text?.trim());
    if (validResumes.length === 0) {
      response.json({ results: [], semanticProvider: "none" });
      return;
    }

    const embeddingResponse = await embedTexts([jobText, ...validResumes.map((resume) => resume.text)]);
    const [jobVector, ...resumeVectorList] = embeddingResponse.vectors;
    const resumeVectors = Object.fromEntries(validResumes.map((resume, index) => [resume.id, resumeVectorList[index]]));

    const results = rankMatches(jobText, validResumes, {
      jobVector,
      resumeVectors,
      semanticProvider: embeddingResponse.provider,
    });

    response.json({
      results,
      semanticProvider: embeddingResponse.provider,
      fallbackReason: embeddingResponse.fallbackReason,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/parse-resumes", upload.array("files"), async (request, response, next) => {
  try {
    const files = request.files;
    if (!Array.isArray(files) || files.length === 0) {
      response.status(400).json({ error: "At least one file is required." });
      return;
    }

    const parsed = await Promise.all(files.map(parseResumeFile));
    response.json({ resumes: parsed });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  response.status(500).json({ error: message });
});

app.listen(port, "127.0.0.1", () => {
  console.log(`SignalFit API listening at http://127.0.0.1:${port}`);
});
