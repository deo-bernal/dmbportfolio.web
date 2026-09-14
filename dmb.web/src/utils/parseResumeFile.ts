import mammoth from "mammoth";
import { getDocument, GlobalWorkerOptions, version as pdfjsVersion } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;

const MAX_FILE_BYTES = 8 * 1024 * 1024;

const ACCEPTED_EXTENSIONS = [".pdf", ".docx"] as const;

export type ResumeParseResult = {
  text: string;
  fileName: string;
};

function getExtension(fileName: string): string {
  const index = fileName.lastIndexOf(".");
  return index >= 0 ? fileName.slice(index).toLowerCase() : "";
}

export function isAcceptedResumeFile(file: File): boolean {
  const extension = getExtension(file.name);
  return ACCEPTED_EXTENSIONS.includes(extension as (typeof ACCEPTED_EXTENSIONS)[number]);
}

export function resumeAcceptAttribute(): string {
  return ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}

function pdfItemsToText(items: Array<{ str?: string; transform?: number[] }>): string {
  const lines: Array<{ y: number; parts: Array<{ x: number; str: string }> }> = [];

  for (const item of items) {
    const str = String(item.str || "");
    if (!str) continue;
    const x = item.transform?.[4] ?? 0;
    const y = item.transform?.[5] ?? 0;
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - y) < 2.5) {
      last.parts.push({ x, str });
    } else {
      lines.push({ y, parts: [{ x, str }] });
    }
  }

  return lines
    .map((line) =>
      line.parts
        .sort((a, b) => a.x - b.x)
        .map((part) => part.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean)
    .join("\n");
}

async function extractPdfText(data: ArrayBuffer): Promise<string> {
  const pdf = await getDocument({ data: new Uint8Array(data) }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = pdfItemsToText(content.items as Array<{ str?: string; transform?: number[] }>);
    if (text.trim()) pages.push(text.trim());
  }

  return pages.join("\n\n").trim();
}

async function extractDocxText(data: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer: data });
  return String(result.value || "").trim();
}

export async function parseResumeFile(file: File): Promise<ResumeParseResult> {
  if (!isAcceptedResumeFile(file)) {
    throw new Error("Please upload a PDF (.pdf) or Word (.docx) resume.");
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Resume file must be 8 MB or smaller.");
  }

  const extension = getExtension(file.name);
  const data = await file.arrayBuffer();

  let text = "";
  if (extension === ".pdf") {
    text = await extractPdfText(data);
  } else if (extension === ".docx") {
    text = await extractDocxText(data);
  }

  if (!text || text.length < 40) {
    throw new Error(
      "Could not read enough text from that file. Try another export, or paste the resume text instead."
    );
  }

  return { text, fileName: file.name };
}
