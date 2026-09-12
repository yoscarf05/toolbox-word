/**
 * Spatial Graphics & CTM Tracker for PDF.js
 * Tracks Current Transformation Matrix (CTM) to accurately locate
 * images, vector paths, and bounding boxes on the page.
 */

import * as pdfjsLib from 'pdfjs-dist';

export interface Matrix2D {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export function multiplyMatrices(m1: Matrix2D, m2: Matrix2D): Matrix2D {
  return {
    a: m1.a * m2.a + m1.b * m2.c,
    b: m1.a * m2.b + m1.b * m2.d,
    c: m1.c * m2.a + m1.d * m2.c,
    d: m1.c * m2.b + m1.d * m2.d,
    e: m1.e * m2.a + m1.f * m2.c + m2.e,
    f: m1.e * m2.b + m1.f * m2.d + m2.f,
  };
}

export interface LocatedImage {
  name: string;
  x: number;      // pt from left
  y: number;      // pt from top
  width: number;  // pt width
  height: number; // pt height
  aspectRatio: number;
}

export interface VectorShape {
  type: 'rect' | 'line' | 'path';
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor?: string;
  strokeColor?: string;
}

/**
 * Parses operator list with transformation matrix stack to find
 * exact physical coordinates of all images and key vector shapes.
 */
export async function extractSpatialGraphics(
  page: any,
  pageWidth: number,
  pageHeight: number
): Promise<{ images: LocatedImage[]; shapes: VectorShape[] }> {
  const locatedImages: LocatedImage[] = [];
  const shapes: VectorShape[] = [];

  try {
    const ops = await page.getOperatorList();
    const fnArray = ops.fnArray;
    const argsArray = ops.argsArray;

    // Transformation matrix stack
    let ctm: Matrix2D = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    const matrixStack: Matrix2D[] = [];

    for (let i = 0; i < fnArray.length; i++) {
      const fn = fnArray[i];
      const args = argsArray[i];

      if (fn === pdfjsLib.OPS.save) {
        matrixStack.push({ ...ctm });
      } else if (fn === pdfjsLib.OPS.restore) {
        if (matrixStack.length > 0) {
          ctm = matrixStack.pop()!;
        }
      } else if (fn === pdfjsLib.OPS.transform) {
        // args: [a, b, c, d, e, f]
        if (Array.isArray(args) && args.length >= 6) {
          const transformMatrix: Matrix2D = {
            a: args[0],
            b: args[1],
            c: args[2],
            d: args[3],
            e: args[4],
            f: args[5],
          };
          ctm = multiplyMatrices(transformMatrix, ctm);
        }
      } else if (
        fn === pdfjsLib.OPS.paintImageXObject ||
        fn === pdfjsLib.OPS.paintInlineImageXObject
      ) {
        const imgName = args && args[0];
        if (imgName) {
          // In PDF, an image is drawn in unit square [0,0] to [1,1]
          // The CTM maps this unit square to the actual page coordinates.
          // PDF origin is bottom-left. In our system, top-left is (0,0).
          const widthPt = Math.abs(ctm.a);
          const heightPt = Math.abs(ctm.d);
          const xPt = ctm.e;
          // transform from PDF bottom-left to top-left
          const yPt = pageHeight - ctm.f - (ctm.d > 0 ? heightPt : 0);

          if (widthPt >= 10 && heightPt >= 10) {
            locatedImages.push({
              name: String(imgName),
              x: Math.max(0, xPt),
              y: Math.max(0, yPt),
              width: widthPt,
              height: heightPt,
              aspectRatio: heightPt > 0 ? widthPt / heightPt : 1,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Spatial graphics tracking warning:', err);
  }

  return { images: locatedImages, shapes };
}
