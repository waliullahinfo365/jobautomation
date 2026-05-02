// TODO: Generate PDF exports from document content.
// Consider: puppeteer, @react-pdf/renderer, or pdfkit.

export class PDFService {
  /**
   * TODO: Convert HTML content to a PDF buffer.
   */
  async htmlToPDF(_html: string): Promise<Buffer> {
    // TODO: Use puppeteer headless or pdfkit
    throw new Error("PDFService.htmlToPDF not implemented");
  }

  /**
   * TODO: Export a document record as PDF and upload to Drive.
   */
  async exportDocument(_documentId: string): Promise<{ url: string }> {
    throw new Error("PDFService.exportDocument not implemented");
  }

  /**
   * TODO: Generate a formatted weekly report PDF.
   */
  async generateWeeklyReportPDF(_reportId: string): Promise<Buffer> {
    throw new Error("PDFService.generateWeeklyReportPDF not implemented");
  }
}
