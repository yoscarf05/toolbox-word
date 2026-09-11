/**
 * Visual Asset Extractor for PDF Documents
 * Handles native raster image extraction, vector diagram snapshots, and OCR for scanned documents.
 */

import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import type {
  ImageElementData,
  DiagramElementData,
  DocumentElement,
} from './types.ts';

/**
 * Converts ImageData or raw RGBA buffer into PNG Uint8Array using browser or offscreen Canvas
 */
export function rgbaToPngUint8(
  rgba: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number
): Uint8Array | null {
  try {
    if (typeof document === 'undefined') {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const imgData = ctx.createImageData(width, height);
    imgData.data.set(rgba);
    ctx.putImageData(imgData, 0, 0);

    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    return null;
  }
}

/**
 * Extracts embedded raster images from a PDF.js page
 */
export async function extractPageImages(
  page: any,
  pageNumber: number,
  pageWidth: number,
  pageHeight: number
): Promise<ImageElementData[]> {
  const images: ImageElementData[] = [];

  try {
    const ops = await page.getOperatorList();
    const fnArray = ops.fnArray;
    const argsArray = ops.argsArray;

    for (let i = 0; i < fnArray.length; i++) {
      const fn = fnArray[i];

      if (
        fn === pdfjsLib.OPS.paintImageXObject ||
        fn === pdfjsLib.OPS.paintInlineImageXObject
      ) {
        const imgName = argsArray[i][0];
        try {
          const imgObj = await new Promise<any>((resolve) => {
            if (page.objs && page.objs.has(imgName)) {
              page.objs.get(imgName, (data: any) => resolve(data));
            } else {
              resolve(null);
            }
          });

          if (!imgObj || !imgObj.data || !imgObj.width || !imgObj.height) {
            continue;
          }

          const rawW = imgObj.width;
          const rawH = imgObj.height;

          // Skip tiny decorative 1x1 pixels or line dividers
          if (rawW < 12 || rawH < 12) continue;

          let pngBytes: Uint8Array | null = null;

          if (imgObj.data instanceof Uint8ClampedArray || imgObj.data instanceof Uint8Array) {
            let rgbaData: Uint8ClampedArray;
            if (imgObj.kind === 1 || imgObj.kind === 2) {
              // Grayscale or RGB
              rgbaData = new Uint8ClampedArray(rawW * rawH * 4);
              const src = imgObj.data;
              const isRgb = src.length >= rawW * rawH * 3;
              for (let p = 0; p < rawW * rawH; p++) {
                if (isRgb) {
                  rgbaData[p * 4] = src[p * 3];
                  rgbaData[p * 4 + 1] = src[p * 3 + 1];
                  rgbaData[p * 4 + 2] = src[p * 3 + 2];
                  rgbaData[p * 4 + 3] = 255;
                } else {
                  const val = src[p];
                  rgbaData[p * 4] = val;
                  rgbaData[p * 4 + 1] = val;
                  rgbaData[p * 4 + 2] = val;
                  rgbaData[p * 4 + 3] = 255;
                }
              }
            } else {
              rgbaData = new Uint8ClampedArray(imgObj.data.buffer || imgObj.data);
            }

            pngBytes = rgbaToPngUint8(rgbaData, rawW, rawH);
          }

          if (pngBytes && pngBytes.length > 50) {
            const aspect = rawW / rawH;
            // Target reasonable display width in points (max 480pt)
            const displayW = Math.min(480, Math.max(120, rawW * 0.75));
            const displayH = displayW / aspect;

            images.push({
              id: `img_p${pageNumber}_${i}`,
              imageData: pngBytes,
              mimeType: 'image/png',
              widthPt: displayW,
              heightPt: displayH,
              aspectRatio: aspect,
            });
          }
        } catch (e) {
          // Non-critical image extraction error
        }
      }
    }
  } catch (e) {
    // Non-critical operator list error
  }

  return images;
}

/**
 * Renders a full page to high-DPI canvas
 */
export async function renderPageToCanvas(
  page: any,
  scale: number = 2.0
): Promise<HTMLCanvasElement | null> {
  if (typeof document === 'undefined') return null;

  try {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas;
  } catch (e) {
    return null;
  }
}

/**
 * Detects if a page has vector diagram clusters and crops them as high-res images
 */
export async function extractDiagramsFromPage(
  page: any,
  pageNumber: number,
  pageWidth: number,
  pageHeight: number,
  renderedCanvas: HTMLCanvasElement | null
): Promise<DiagramElementData[]> {
  if (!renderedCanvas || typeof document === 'undefined') return [];

  const diagrams: DiagramElementData[] = [];

  try {
    const ops = await page.getOperatorList();
    const fnArray = ops.fnArray;

    // Check count of vector path drawing operations
    let vectorPathOps = 0;
    for (const fn of fnArray) {
      if (
        fn === pdfjsLib.OPS.constructPath ||
        fn === pdfjsLib.OPS.stroke ||
        fn === pdfjsLib.OPS.fill ||
        fn === pdfjsLib.OPS.eoFill
      ) {
        vectorPathOps++;
      }
    }

    // If page has a dense cluster of vector operations (charts, diagrams, geometric figures)
    if (vectorPathOps > 45) {
      const scale = renderedCanvas.width / pageWidth;
      // Capture diagram snapshot from the middle or lower section of page
      const cropW = Math.min(pageWidth - 72, 480);
      const cropH = Math.min(pageHeight * 0.45, 300);
      const cropX = (pageWidth - cropW) / 2;
      const cropY = pageHeight * 0.28;

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = cropW * scale;
      cropCanvas.height = cropH * scale;
      const cropCtx = cropCanvas.getContext('2d');

      if (cropCtx) {
        cropCtx.drawImage(
          renderedCanvas,
          cropX * scale,
          cropY * scale,
          cropW * scale,
          cropH * scale,
          0,
          0,
          cropW * scale,
          cropH * scale
        );

        const dataUrl = cropCanvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let j = 0; j < binary.length; j++) {
          bytes[j] = binary.charCodeAt(j);
        }

        diagrams.push({
          id: `diag_p${pageNumber}_0`,
          imageData: bytes,
          widthPt: cropW,
          heightPt: cropH,
          boundingBox: {
            minX: cropX,
            minY: cropY,
            maxX: cropX + cropW,
            maxY: cropY + cropH,
          },
        });
      }
    }
  } catch (e) {
    // Non-critical diagram extraction error
  }

  return diagrams;
}

/**
 * Performs OCR on a scanned page using Tesseract.js
 */
export async function performOcrOnScannedPage(
  canvas: HTMLCanvasElement,
  onProgress?: (pct: number) => void
): Promise<{ text: string; lines: string[] }> {
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const result = await Tesseract.recognize(dataUrl, 'spa+eng', {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });

    const fullText = result.data.text || '';
    const rawLines = fullText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    return {
      text: fullText,
      lines: rawLines,
    };
  } catch (e) {
    console.warn('OCR processing skipped or failed:', e);
    return { text: '', lines: [] };
  }
}
