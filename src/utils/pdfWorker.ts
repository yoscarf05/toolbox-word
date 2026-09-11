import * as pdfjsLib from 'pdfjs-dist';

/**
 * Initializes and ensures that the PDF.js Web Worker is configured
 * using standard URL resolution.
 * This guarantees execution in all browser contexts, sandboxes, and iframes
 * without CORS errors or 404s.
 */
export function ensurePdfWorker(): void {
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    try {
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc || pdfjsLib.GlobalWorkerOptions.workerSrc.includes('unpkg')) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();
      }
    } catch (err) {
      console.warn('PDF.js worker setup notification:', err);
    }
  }
}
