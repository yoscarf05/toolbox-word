/**
 * Unified PDF to Word Architecture & Pipeline
 * Deep document analysis engine: cover pages, multi-column layouts, tables, vector diagrams,
 * photos, formulas, and OCR for scanned documents.
 */

import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { ensurePdfWorker } from './pdfWorker.ts';
import type {
  DocumentAnalysisResult,
  ConversionOptions,
  PageMetadata,
  DocumentElement,
} from './pdf/types.ts';
import { analyzePageLayout } from './pdf/layoutDetector.ts';
import type { RawPageData } from './pdf/layoutDetector.ts';
import {
  extractPageImages,
  renderPageToCanvas,
  extractDiagramsFromPage,
  performOcrOnScannedPage,
} from './pdf/visualExtractor.ts';
import { buildEnterpriseDocx } from './pdf/docxBuilder.ts';

// Re-export types for consumers
export type * from './pdf/types.ts';

// Backward compatibility alias for UI components
export type PdfDocumentAnalysis = DocumentAnalysisResult;
export type DocxGenerationOptions = ConversionOptions;

/**
 * Loads a PDF document with multi-tier resilience
 */
async function loadPdfDocumentResiliently(arrayBuffer: ArrayBuffer): Promise<any> {
  ensurePdfWorker();

  // Tier 1: Standard loading with active worker
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });
    return await loadingTask.promise;
  } catch (primaryErr) {
    console.warn('Primary PDF load warning, switching to fallback in-memory parser:', primaryErr);
  }

  // Tier 2: In-memory fallback
  try {
    const fallbackTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      disableRange: true,
      disableStream: true,
      disableAutoFetch: true,
      isEvalSupported: false,
    });
    return await fallbackTask.promise;
  } catch (secErr) {
    console.error('All PDF parser tiers failed:', secErr);
    throw new Error(
      'No se pudo procesar la estructura interna del archivo PDF. Es posible que el archivo esté protegido con contraseña o dañado.'
    );
  }
}

/**
 * Deep extraction and structural analysis of a PDF document
 */
export async function extractStructuredPdf(
  arrayBuffer: ArrayBuffer,
  fileName: string = 'documento.pdf',
  onProgress?: (pct: number, msg: string) => void
): Promise<DocumentAnalysisResult> {
  onProgress?.(5, 'Cargando motor de análisis de documentos PDF...');

  const pdfDoc = await loadPdfDocumentResiliently(arrayBuffer);
  const pageCount = pdfDoc.numPages;

  let docMetadata: any = {};
  try {
    const metaObj = await pdfDoc.getMetadata();
    docMetadata = metaObj.info || {};
  } catch (e) {
    // Non-critical metadata read
  }

  const pages: PageMetadata[] = [];
  let totalWordCount = 0;
  let hasCoverPage = false;
  let hasImages = false;
  let hasDiagrams = false;
  let hasTables = false;
  let hasMultiColumns = false;
  let hasFormulas = false;
  let hasScannedPages = false;

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const pct = Math.round(10 + (pageNum / pageCount) * 65);
    onProgress?.(pct, `Analizando página ${pageNum} de ${pageCount}...`);

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const pageWidth = viewport.width;
    const pageHeight = viewport.height;

    // 1. Extract raw text content with spatial coordinates
    const textContent = await page.getTextContent({
      includeMarkedContent: true,
    });

    const rawItems = textContent.items
      .filter((it: any) => it.str !== undefined && it.str !== null)
      .map((it: any) => {
        const transform = it.transform || [1, 0, 0, 1, 0, 0];
        const fontHeight = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]);
        const x = transform[4];
        const y = pageHeight - transform[5]; // Convert from bottom-left to top-left coords

        const fontName = (it.fontName || '').toLowerCase();
        const isBold =
          fontName.includes('bold') ||
          fontName.includes('black') ||
          fontName.includes('heavy') ||
          fontName.includes('bld');
        const isItalic =
          fontName.includes('italic') ||
          fontName.includes('oblique') ||
          fontName.includes('it');

        return {
          str: it.str,
          x,
          y,
          width: it.width || 0,
          height: it.height || fontHeight,
          fontSize: Math.round(fontHeight * 10) / 10,
          fontName: it.fontName || 'Calibri',
          bold: isBold,
          italic: isItalic,
        };
      });

    // 2. Perform Layout and Semantic Detection (Cover, Columns, Tables, Lists, Headings)
    const rawPageData: RawPageData = {
      pageNumber: pageNum,
      width: pageWidth,
      height: pageHeight,
      items: rawItems,
    };

    const pageLayout = analyzePageLayout(rawPageData);

    if (pageLayout.isCoverPage) hasCoverPage = true;
    if (pageLayout.columnCount > 1) hasMultiColumns = true;
    if (pageLayout.elements.some((e) => e.type === 'table')) hasTables = true;
    if (pageLayout.elements.some((e) => e.type === 'formula')) hasFormulas = true;

    // 3. Extract Embedded Raster Images
    const extractedImages = await extractPageImages(page, pageNum, pageWidth, pageHeight);
    if (extractedImages.length > 0) {
      hasImages = true;
      for (const img of extractedImages) {
        pageLayout.elements.push({
          id: `elem_${img.id}`,
          type: 'image',
          pageNumber: pageNum,
          y: pageHeight * 0.5,
          image: img,
        });
      }
    }

    // 4. Render Page to Canvas for Diagram Snapshots and Scanned Page OCR
    const pageCanvas = await renderPageToCanvas(page, 2.0);

    // Extract Vector Diagram Snapshots (charts, schematics, vector drawings)
    if (pageCanvas) {
      const extractedDiagrams = await extractDiagramsFromPage(
        page,
        pageNum,
        pageWidth,
        pageHeight,
        pageCanvas
      );
      if (extractedDiagrams.length > 0) {
        hasDiagrams = true;
        for (const diag of extractedDiagrams) {
          pageLayout.elements.push({
            id: `elem_${diag.id}`,
            type: 'diagram',
            pageNumber: pageNum,
            y: diag.boundingBox.minY,
            diagram: diag,
          });
        }
      }
    }

    // 5. Handle Scanned Documents with OCR
    if (pageLayout.isScannedPage && pageCanvas) {
      hasScannedPages = true;
      onProgress?.(pct, `Aplicando OCR a página escaneada ${pageNum}...`);
      const ocrResult = await performOcrOnScannedPage(pageCanvas);
      pageLayout.ocrText = ocrResult.text;
    }

    // Calculate total words on this page
    const pageWordCount = rawItems.reduce(
      (sum, it) => sum + it.str.trim().split(/\s+/).filter(Boolean).length,
      0
    );
    totalWordCount += pageWordCount;

    pages.push(pageLayout);
  }

  const allElements = pages.flatMap((p) => p.elements);

  return {
    fileName,
    pageCount,
    hasCoverPage,
    hasImages,
    hasDiagrams,
    hasTables,
    hasMultiColumns,
    hasFormulas,
    hasScannedPages,
    isEntirelyScanned: hasScannedPages && totalWordCount < 20,
    totalWords: totalWordCount,
    pages,
    allElements,
    metadata: {
      title: docMetadata.Title || fileName.replace(/\.[^/.]+$/, ''),
      author: docMetadata.Author,
      creator: docMetadata.Creator,
      creationDate: docMetadata.CreationDate,
    },
  };
}

/**
 * Builds compliant Microsoft Word OpenXML document
 */
export async function buildCompliantDocx(
  analysis: DocumentAnalysisResult,
  options: ConversionOptions = {},
  onProgress?: (pct: number, msg: string) => void
): Promise<Blob> {
  return await buildEnterpriseDocx(analysis, options, onProgress);
}

/**
 * Validates the generated DOCX blob by verifying internal OpenXML file structure
 */
export async function validateDocxBlob(
  blob: Blob
): Promise<{ isValid: boolean; entryCount?: number; byteSize: number; error?: string }> {
  try {
    if (!blob || blob.size < 500) {
      return {
        isValid: false,
        byteSize: blob ? blob.size : 0,
        error: 'El archivo generado es demasiado pequeño para ser un documento OpenXML válido.',
      };
    }

    const zip = new JSZip();
    const arrayBuffer = await blob.arrayBuffer();
    const unzipped = await zip.loadAsync(arrayBuffer);

    // Required OpenXML parts
    const hasContentTypes = unzipped.file('[Content_Types].xml') !== null;
    const hasDocument = unzipped.file('word/document.xml') !== null;
    const hasRels = unzipped.file('_rels/.rels') !== null;

    if (!hasContentTypes || !hasDocument || !hasRels) {
      return {
        isValid: false,
        byteSize: blob.size,
        error: 'El archivo DOCX no contiene las partes estándar requeridas por la especificación Office Open XML.',
      };
    }

    // Verify word/document.xml is non-empty and well-formed
    const docXml = await unzipped.file('word/document.xml')!.async('text');
    if (!docXml.includes('<w:document') || !docXml.includes('</w:document>')) {
      return {
        isValid: false,
        byteSize: blob.size,
        error: 'El contenido XML principal del documento Word está incompleto o dañado.',
      };
    }

    const entryCount = Object.keys(unzipped.files).length;
    return {
      isValid: true,
      entryCount,
      byteSize: blob.size,
    };
  } catch (err: any) {
    return {
      isValid: false,
      byteSize: blob ? blob.size : 0,
      error: `Error al validar el archivo DOCX: ${err.message}`,
    };
  }
}
