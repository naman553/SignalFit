import mammoth from "mammoth";
import pdf from "pdf-parse";

export type ParsedUpload = {
  id: string;
  label: string;
  text: string;
  fileName: string;
  type: string;
};

type UploadedFile = Express.Multer.File;

export async function parseResumeFile(file: UploadedFile): Promise<ParsedUpload> {
  const extension = extensionFor(file.originalname);
  const text = await extractText(file, extension);

  return {
    id: crypto.randomUUID(),
    label: file.originalname.replace(/\.[^.]+$/, ""),
    text: normalizeExtractedText(text),
    fileName: file.originalname,
    type: extension || "unknown",
  };
}

async function extractText(file: UploadedFile, extension: string): Promise<string> {
  if (extension === "pdf" || file.mimetype === "application/pdf") {
    return extractPdfText(file.buffer);
  }

  if (extension === "docx") {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }

  if (extension === "doc") {
    throw new Error(`${file.originalname} is a legacy .doc file. Please convert it to .docx or PDF.`);
  }

  return file.buffer.toString("utf8");
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const result = await pdf(buffer);
  return result.text;
}

function extensionFor(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function normalizeExtractedText(text: string): string {
  return text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
