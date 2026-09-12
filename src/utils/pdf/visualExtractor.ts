/**
 * Visual Asset Extractor for PDF Documents
 * High-fidelity native raster image extraction, vector diagram snapshots,
 * and spatial coordinate mapping using the graphics state CTM.
 */

import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import type {
  ImageElementData,
  DiagramElementData,
} from './types.ts';
import { extractSpatialGraphics, LocatedImage } from './spatialTracker.ts';

/**
 * Converts ImageData or raw RGBA buffer into PNG Uint8Array using browser Canvas
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
 * Extracts embedded raster images from a PDF.js page with exact spatial positioning
 */
export async function extractPageImages(
  page: any,
  pageNumber: number,
  pageWidth: number,
  pageHeight: number
): Promise<(ImageElementData & { x: number; y: number })[]> {
  const result: (ImageElementData & { x: number; y: number })[] = [];

  try {
    // 1. Extract physical coordinates via CTM tracking
    const { images: spatialImages } = await extractSpatialGraphics(page, pageWidth, pageHeight);

    // 2. Fetch image payloads from PDF.js operator list
    const ops = await page.getOperatorList();
    const fnArray = ops.fnArray;
    const argsArray = ops.argsArray;

    let spatialIdx = 0;

    for (let i = 0; i < fnArray.length; i++) {
      const fn = fnArray[i];

      if (
        fn === pdfjsLib.OPS.paintImageXObject ||
        fn === pdfjsLib.OPS.paintInlineImageXObject
      ) {
        const imgName = argsArray[i][0];
        const spatialInfo: LocatedImage | undefined = spatialImages[spatialIdx++];

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

          // Skip tiny 1x1 noise or decorative hairline dividers
          if (rawW < 12 || rawH < 12) continue;

          let pngBytes: Uint8Array | null = null;

          if (imgObj.data instanceof Uint8ClampedArray || imgObj.data instanceof Uint8Array) {
            let rgbaData: Uint8ClampedArray;
            if (imgObj.kind === 1 || imgObj.kind === 2) {
              // Grayscale (kind 1) or RGB (kind 2)
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
              // RGBA or direct buffer
              rgbaData = new Uint8ClampedArray(imgObj.data.buffer || imgObj.data);
            }

            pngBytes = rgbaToPngUint8(rgbaData, rawW, rawH);
          }

          if (pngBytes && pngBytes.length > 50) {
            const aspect = rawW / rawH;
            // Use exact physical dimensions if captured by CTM tracker, else compute reasonable bounds
            const displayW = spatialInfo?.width 
              ? Math.min(pageWidth - 72, Math.max(40, spatialInfo.width))
              : Math.min(480, Math.max(120, rawW * 0.75));

            const displayH = spatialInfo?.height
              ? Math.min(pageHeight - 72, Math.max(30, spatialInfo.height))
              : displayW / aspect;

            const posX = spatialInfo?.x !== undefined ? spatialInfo.x : (pageWidth - displayW) / 2;
            const posY = spatialInfo?.y !== undefined ? spatialInfo.y : pageHeight * 0.3;

            // Check if this image covers a major portion of the page (possible cover artwork or header banner)
            const isCoverIllustration = pageNumber === 1 && (displayW > pageWidth * 0.5 || displayH > pageHeight * 0.3);

            result.push({
              id: `img_p${pageNumber}_${i}`,
              imageData: pngBytes,
              mimeType: 'image/png',
              widthPt: displayW,
              heightPt: displayH,
              aspectRatio: aspect,
              x: posX,
              y: posY,
              isCoverIllustration,
            });
          }
        } catch (e) {
          // Continue processing remaining images
        }
      }
    }
  } catch (e) {
    console.warn('Image extraction warning:', e);
  }

  return result;
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
 * Extracts vector diagram snapshots (charts, complex geometric paths, schematics)
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

    // Dense cluster of drawing operations indicates charts, schematics, or graphics
    if (vectorPathOps > 50) {
      const scale = renderedCanvas.width / pageWidth;
      const cropW = Math.min(pageWidth - 72, 480);
      const cropH = Math.min(pageHeight * 0.45, 300);
      const cropX = (pageWidth - cropW) / 2;
      const cropY = pageHeight * 0.3;

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
        for (let b = 0; b < binary.length; b++) {
          bytes[b] = binary.charCodeAt(b);
        }

        if (bytes.length > 500) {
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
    }
  } catch (e) {
    // Non-critical diagram extraction warning
  }

  return diagrams;
}

/**
 * Performs OCR on scanned page canvas using Tesseract.js
 */
export async function performOcrOnScannedPage(
  canvas: HTMLCanvasElement
): Promise<{ text: string; confidence: number }> {
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const worker = await Tesseract.createWorker('spa+eng');
    const ret = await worker.recognize(dataUrl);
    await worker.terminate();

    return {
      text: ret.data.text,
      confidence: ret.data.confidence,
    };
  } catch (err) {
    console.warn('OCR error fallback:', err);
    return { text: '', confidence: 0 };
  }
}
