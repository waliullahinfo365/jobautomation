/**
 * Best-effort text extraction from a user-selected file in the browser.
 * Used so workspace CV uploads persist `contentText` for AI tailoring.
 */
export async function extractTextFromUpload(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const mime = file.type;

  if (mime.startsWith("text/") || /\.(txt|md|csv|json|html?|log)$/i.test(name)) {
    return (await file.text()).trim();
  }

  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    try {
      const mod = await import("mammoth");
      const mammoth = mod.default ?? mod;
      const buf = await file.arrayBuffer();
      const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
      return (value ?? "").trim();
    } catch {
      return "";
    }
  }

  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const buf = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
      const parts: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        for (const item of textContent.items) {
          const s = (item as { str?: string }).str;
          if (typeof s === "string" && s) parts.push(s);
        }
        parts.push("\n");
      }
      return parts.join(" ").replace(/\s+/g, " ").trim();
    } catch {
      return "";
    }
  }

  return "";
}
