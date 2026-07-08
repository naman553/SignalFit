type JobEditorProps = {
  jobText: string;
  onChange: (value: string) => void;
};

export function JobEditor({ jobText, onChange }: JobEditorProps) {
  return (
    <section className="editor-block">
      <div className="section-heading">
        <div>
          <p className="label">Role</p>
          <h2>Job description</h2>
        </div>
        <span className="count">{jobText.length.toLocaleString()} chars</span>
      </div>
      <textarea
        value={jobText}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Job description"
        spellCheck="true"
      />
    </section>
  );
}
