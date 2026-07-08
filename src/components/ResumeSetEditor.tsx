import { Plus, Upload, X } from "lucide-react";
import type { ResumeInput } from "../types";

type ResumeSetEditorProps = {
  resumes: ResumeInput[];
  uploadMessage: string | null;
  onAddResume: () => void;
  onRemoveResume: (id: string) => void;
  onResumeChange: (id: string, patch: Partial<ResumeInput>) => void;
  onFilesSelected: (files: FileList | null) => void;
};

export function ResumeSetEditor({
  resumes,
  uploadMessage,
  onAddResume,
  onRemoveResume,
  onResumeChange,
  onFilesSelected,
}: ResumeSetEditorProps) {
  return (
    <section className="editor-block">
      <div className="section-heading">
        <div>
          <p className="label">Candidates</p>
          <h2>Resume set</h2>
        </div>
        <div className="actions">
          <label className="icon-button" title="Upload PDF, DOCX, or text resumes">
            <Upload size={17} />
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md,.csv"
              multiple
              onChange={(event) => onFilesSelected(event.target.files)}
            />
          </label>
          <button className="icon-button" type="button" onClick={onAddResume} title="Add resume">
            <Plus size={18} />
          </button>
        </div>
      </div>
      {uploadMessage && <p className="upload-message">{uploadMessage}</p>}

      <div className="resume-editors">
        {resumes.map((resume, index) => (
          <article className="resume-editor" key={resume.id}>
            <div className="resume-editor-top">
              <input
                value={resume.label}
                onChange={(event) => onResumeChange(resume.id, { label: event.target.value })}
                aria-label={`Resume ${index + 1} label`}
              />
              <button
                className="ghost-icon"
                type="button"
                onClick={() => onRemoveResume(resume.id)}
                aria-label={`Remove ${resume.label}`}
                disabled={resumes.length === 1}
              >
                <X size={16} />
              </button>
            </div>
            <textarea
              value={resume.text}
              onChange={(event) => onResumeChange(resume.id, { text: event.target.value })}
              aria-label={`${resume.label} resume`}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
