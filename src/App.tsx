import { useState } from "react";
import { parseResumeFiles } from "./api";
import { Explanation } from "./components/Explanation";
import { Hero } from "./components/Hero";
import { JobEditor } from "./components/JobEditor";
import { ResumeSetEditor } from "./components/ResumeSetEditor";
import { Scoreboard } from "./components/Scoreboard";
import { TopNav } from "./components/TopNav";
import { useMatchResults } from "./hooks/useMatchResults";
import { sampleJob, sampleResumes } from "./sampleData";
import type { ResumeInput } from "./types";

const emptyResume = (): ResumeInput => ({
  id: crypto.randomUUID(),
  label: "New candidate",
  text: "",
});

export function App() {
  const [jobText, setJobText] = useState(sampleJob);
  const [resumes, setResumes] = useState<ResumeInput[]>(sampleResumes);
  const [selectedId, setSelectedId] = useState(sampleResumes[0].id);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const { results, status } = useMatchResults(jobText, resumes);
  const selected = results.find((result) => result.id === selectedId) || results[0];

  function updateResume(id: string, patch: Partial<ResumeInput>) {
    setResumes((current) => current.map((resume) => (resume.id === id ? { ...resume, ...patch } : resume)));
  }

  function addResume() {
    const next = emptyResume();
    setResumes((current) => [...current, next]);
    setSelectedId(next.id);
  }

  function removeResume(id: string) {
    setResumes((current) => current.filter((resume) => resume.id !== id));
    if (selectedId === id) {
      setSelectedId(results.find((result) => result.id !== id)?.id || "");
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploadMessage("Parsing files...");

    try {
      const data = await parseResumeFiles(files);
      setResumes((current) => [...current, ...data.resumes]);
      setSelectedId(data.resumes[0]?.id || selectedId);
      setUploadMessage(`${data.resumes.length} resume${data.resumes.length === 1 ? "" : "s"} parsed.`);
    } catch (error) {
      const textFiles = Array.from(files).filter((file) => /\.(txt|md|csv)$/i.test(file.name));
      const loaded = await Promise.all(
        textFiles.map(async (file) => ({
          id: crypto.randomUUID(),
          label: file.name.replace(/\.[^.]+$/, ""),
          text: await file.text(),
        })),
      );

      if (loaded.length > 0) {
        setResumes((current) => [...current, ...loaded]);
        setSelectedId(loaded[0].id);
        setUploadMessage("Parser API unavailable. Loaded text files locally.");
      } else {
        setUploadMessage(error instanceof Error ? error.message : "Could not parse uploaded files.");
      }
    }
  }

  return (
    <main>
      <TopNav />
      <Hero status={status} />

      <section className="workspace" aria-label="Resume matching workspace">
        <div className="input-column">
          <JobEditor jobText={jobText} onChange={setJobText} />
          <ResumeSetEditor
            resumes={resumes}
            uploadMessage={uploadMessage}
            onAddResume={addResume}
            onRemoveResume={removeResume}
            onResumeChange={updateResume}
            onFilesSelected={handleFiles}
          />
        </div>

        <div className="results-column">
          <Scoreboard results={results} selectedId={selected?.id} onSelect={setSelectedId} />
          {selected && <Explanation result={selected} />}
        </div>
      </section>
    </main>
  );
}
