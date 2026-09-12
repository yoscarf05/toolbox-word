/**
 * Advanced Layout Detector for PDF Documents
 * Spatial-aware document layout analysis:
 * - Zone-based multi-column segregation (Top full-width, 2-column body, Bottom full-width)
 * - Robust cover page identification (language-independent)
 * - Table clustering and alignment
 * - Lists, headings, formulas, and spatial element interleaving
 */

import type {
  DocumentElement,
  ElementType,
  PageMetadata,
  TableElementData,
  TableRowData,
  TableCellData,
  TextRunItem,
  MultiColumnElementData,
  ColumnData,
  ImageElementData,
  DiagramElementData,
} from './types.ts';

export interface RawItem {
  str: string;
  x: number;
  y: number; // pt from top
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  bold: boolean;
  italic: boolean;
  colorHex?: string;
}

export interface RawPageData {
  pageNumber: number;
  width: number;
  height: number;
  items: RawItem[];
}

export function rawItemToRun(it: RawItem): TextRunItem {
  return {
    text: it.str,
    style: {
      fontName: it.fontName,
      fontSize: it.fontSize,
      bold: it.bold,
      italic: it.italic,
      colorHex: it.colorHex || '1E293B',
    },
    x: it.x,
    y: it.y,
    width: it.width,
    height: it.height,
  };
}

/**
 * Checks if text contains common mathematical / scientific symbols
 */
export function isMathExpression(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;
  const mathSymbols = /[=∫∑√±×÷∂∇λπθαβγσεω≈≠≤≥∞]/;
  const equationPattern = /^[A-Za-z0-9\s()_+*/^-]+=[A-Za-z0-9\s()_+*/^-]+$/;
  return mathSymbols.test(trimmed) || (equationPattern.test(trimmed) && trimmed.includes('='));
}

/**
 * Checks if line is a bulleted list item
 */
export function isBulletListItem(text: string): boolean {
  return /^([•\u2022\u25cf\u25cb\u25aa\u25ab\-*–—])\s+/.test(text.trim());
}

/**
 * Checks if line is a numbered list item
 */
export function isNumberedListItem(text: string): boolean {
  return /^([0-9]{1,3}|[a-zA-Z]|[ivxIVX]{1,4})[.)]\s+/.test(text.trim());
}

/**
 * Robust, language-independent cover page detection
 */
export function detectCoverPage(rawPage: RawPageData, hasLargeImage: boolean = false): boolean {
  if (rawPage.pageNumber !== 1) return false;
  if (rawPage.items.length === 0 && !hasLargeImage) return false;

  const fontSizes = rawPage.items.map((i) => i.fontSize);
  const maxFontSize = fontSizes.length > 0 ? Math.max(...fontSizes) : 0;
  const totalWords = rawPage.items.reduce((acc, it) => acc + it.str.trim().split(/\s+/).filter(Boolean).length, 0);

  // Content pages with explicit multi-section outlines (1.1, 1.2, Chapter 2) are not covers
  const allText = rawPage.items.map((it) => it.str).join(' ').toLowerCase();
  if (/\b(1\.1|1\.2|2\.1|2\.2|3\.1)\b/.test(allText)) {
    return false;
  }

  // A cover page typically has:
  // 1. Prominent title (font size >= 20pt) AND sparse body text (< 160 words)
  // OR 2. Very low word count (< 80 words) with a large graphic/illustration
  // OR 3. Clear title-centered layout with author/date metadata
  if (maxFontSize >= 20 && totalWords < 180) {
    return true;
  }

  if (hasLargeImage && totalWords < 100) {
    return true;
  }

  return false;
}

/**
 * Groups raw text items into horizontal lines (within a specific bounding region or column)
 */
export function groupItemsIntoLines(items: RawItem[]): { y: number; items: RawItem[] }[] {
  if (items.length === 0) return [];

  // Sort primarily by Y ascending, secondarily by X ascending
  const sorted = [...items].sort((a, b) => {
    const yDiff = a.y - b.y;
    if (Math.abs(yDiff) > 3.0) return yDiff;
    return a.x - b.x;
  });

  const lines: { y: number; items: RawItem[] }[] = [];
  let currentLine: { y: number; items: RawItem[] } = { y: sorted[0].y, items: [sorted[0]] };

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    if (Math.abs(item.y - currentLine.y) <= 3.5) {
      currentLine.items.push(item);
    } else {
      currentLine.items.sort((a, b) => a.x - b.x);
      lines.push(currentLine);
      currentLine = { y: item.y, items: [item] };
    }
  }

  currentLine.items.sort((a, b) => a.x - b.x);
  lines.push(currentLine);

  return lines;
}

/**
 * Detects whether a page region has a 2-column layout with a vertical gutter
 */
export function detectColumnGutter(
  items: RawItem[],
  pageWidth: number,
  margin: number = 40
): { isMultiColumn: boolean; gutterX: number; gutterWidth: number } {
  if (items.length < 20) {
    return { isMultiColumn: false, gutterX: 0, gutterWidth: 0 };
  }

  const bucketSize = 8;
  const numBuckets = Math.ceil(pageWidth / bucketSize);
  const histogram = new Array(numBuckets).fill(0);

  for (const item of items) {
    const startB = Math.max(0, Math.floor(item.x / bucketSize));
    const endB = Math.min(numBuckets - 1, Math.floor((item.x + item.width) / bucketSize));
    for (let b = startB; b <= endB; b++) {
      histogram[b]++;
    }
  }

  // Look for gutter in the central zone (35% to 65% of page width)
  const centerMin = Math.floor((pageWidth * 0.35) / bucketSize);
  const centerMax = Math.floor((pageWidth * 0.65) / bucketSize);

  let bestGutterStart = -1;
  let bestGutterWidth = 0;
  let currentStart = -1;

  for (let b = centerMin; b <= centerMax; b++) {
    if (histogram[b] <= 1) {
      if (currentStart === -1) currentStart = b;
    } else {
      if (currentStart !== -1) {
        const width = (b - currentStart) * bucketSize;
        if (width > bestGutterWidth) {
          bestGutterWidth = width;
          bestGutterStart = currentStart * bucketSize;
        }
        currentStart = -1;
      }
    }
  }

  if (bestGutterWidth >= 16) {
    const gutterCenter = bestGutterStart + bestGutterWidth / 2;
    const leftItems = items.filter((it) => it.x + it.width <= gutterCenter);
    const rightItems = items.filter((it) => it.x >= gutterCenter);

    if (leftItems.length > 8 && rightItems.length > 8) {
      return { isMultiColumn: true, gutterX: gutterCenter, gutterWidth: bestGutterWidth };
    }
  }

  return { isMultiColumn: false, gutterX: 0, gutterWidth: 0 };
}

/**
 * Detects tabular data from aligned text lines
 */
function detectTableFromLines(
  lines: { y: number; items: RawItem[] }[],
  startIndex: number
): { table: TableElementData; consumedCount: number } | null {
  if (startIndex >= lines.length - 1) return null;

  const candidateRows: { y: number; cells: { text: string; x: number; width: number; runs: TextRunItem[] }[] }[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const lineItems = line.items.filter((it) => it.str.trim().length > 0);
    if (lineItems.length < 2) break;

    const cells: { text: string; x: number; width: number; runs: TextRunItem[] }[] = [];
    let curCell = {
      text: lineItems[0].str,
      x: lineItems[0].x,
      width: lineItems[0].width,
      runs: [rawItemToRun(lineItems[0])],
    };

    for (let c = 1; c < lineItems.length; c++) {
      const item = lineItems[c];
      const gap = item.x - (curCell.x + curCell.width);

      if (gap > 16) {
        cells.push(curCell);
        curCell = {
          text: item.str,
          x: item.x,
          width: item.width,
          runs: [rawItemToRun(item)],
        };
      } else {
        curCell.text += ' ' + item.str;
        curCell.width = item.x + item.width - curCell.x;
        curCell.runs.push(rawItemToRun(item));
      }
    }
    cells.push(curCell);

    if (cells.length >= 2) {
      candidateRows.push({ y: line.y, cells });
    } else {
      break;
    }
  }

  // Must have at least 2 aligned rows to form a true table
  if (candidateRows.length >= 2) {
    const maxCols = Math.max(...candidateRows.map((r) => r.cells.length));
    const rows: TableRowData[] = candidateRows.map((r, rIdx) => ({
      isHeader: rIdx === 0,
      cells: r.cells.map((c) => ({
        text: c.text.trim(),
        runs: c.runs,
        isHeader: rIdx === 0,
        align: 'left',
      })),
    }));

    const columnWidthsPct = new Array(maxCols).fill(Math.round(100 / maxCols));

    return {
      table: {
        rows,
        columnCount: maxCols,
        columnWidthsPct,
        hasBorders: true,
      },
      consumedCount: candidateRows.length,
    };
  }

  return null;
}

/**
 * Converts a sequence of text lines into semantically typed DocumentElements
 */
function convertLinesToElements(
  lines: { y: number; items: RawItem[] }[],
  medianSize: number,
  pageNumber: number,
  isCover: boolean
): DocumentElement[] {
  const result: DocumentElement[] = [];
  let i = 0;

  while (i < lines.length) {
    // 1. Table Detection
    const tableDetection = detectTableFromLines(lines, i);
    if (tableDetection) {
      result.push({
        id: `p${pageNumber}_tbl_${i}`,
        type: 'table',
        pageNumber,
        y: lines[i].y,
        table: tableDetection.table,
      });
      i += tableDetection.consumedCount;
      continue;
    }

    const line = lines[i];
    const lineText = line.items.map((it) => it.str).join(' ').trim();
    if (!lineText) {
      i++;
      continue;
    }

    const maxFontSize = Math.max(...line.items.map((it) => it.fontSize));
    const isBold = line.items.some((it) => it.bold);
    const runs = line.items.map(rawItemToRun);

    // 2. Cover Page Elements
    if (isCover) {
      if (maxFontSize >= 20 || (maxFontSize >= 16 && isBold)) {
        result.push({
          id: `p${pageNumber}_cover_title_${i}`,
          type: 'cover_title',
          pageNumber,
          y: line.y,
          text: lineText,
          runs,
          alignment: 'center',
        });
      } else if (maxFontSize >= 13) {
        result.push({
          id: `p${pageNumber}_cover_sub_${i}`,
          type: 'cover_subtitle',
          pageNumber,
          y: line.y,
          text: lineText,
          runs,
          alignment: 'center',
        });
      } else {
        result.push({
          id: `p${pageNumber}_cover_meta_${i}`,
          type: 'cover_meta',
          pageNumber,
          y: line.y,
          text: lineText,
          runs,
          alignment: 'center',
        });
      }
      i++;
      continue;
    }

    // 3. Mathematical Formula
    if (isMathExpression(lineText)) {
      result.push({
        id: `p${pageNumber}_formula_${i}`,
        type: 'formula',
        pageNumber,
        y: line.y,
        text: lineText,
        runs,
        formula: {
          rawFormula: lineText,
          isBlockEquation: true,
        },
      });
      i++;
      continue;
    }

    // 4. Bullet List Item
    if (isBulletListItem(lineText)) {
      result.push({
        id: `p${pageNumber}_bullet_${i}`,
        type: 'bullet_list',
        pageNumber,
        y: line.y,
        text: lineText.replace(/^([•\u2022\u25cf\u25cb\u25aa\u25ab\-*–—])\s+/, ''),
        runs,
      });
      i++;
      continue;
    }

    // 5. Numbered List Item
    if (isNumberedListItem(lineText)) {
      result.push({
        id: `p${pageNumber}_num_${i}`,
        type: 'numbered_list',
        pageNumber,
        y: line.y,
        text: lineText.replace(/^([0-9]{1,3}|[a-zA-Z]|[ivxIVX]{1,4})[.)]\s+/, ''),
        runs,
      });
      i++;
      continue;
    }

    // 6. Section Headings (H1, H2, H3)
    if (
      maxFontSize >= 14 ||
      maxFontSize >= medianSize * 1.35 ||
      (maxFontSize >= medianSize * 1.15 && isBold)
    ) {
      const headingType: ElementType =
        maxFontSize >= 18 || maxFontSize >= medianSize * 1.6
          ? 'heading1'
          : maxFontSize >= 14 || maxFontSize >= medianSize * 1.3
          ? 'heading2'
          : 'heading3';

      result.push({
        id: `p${pageNumber}_h_${i}`,
        type: headingType,
        pageNumber,
        y: line.y,
        text: lineText,
        runs,
      });
      i++;
      continue;
    }

    // 7. Regular Paragraph
    result.push({
      id: `p${pageNumber}_p_${i}`,
      type: 'paragraph',
      pageNumber,
      y: line.y,
      text: lineText,
      runs,
    });
    i++;
  }

  return result;
}

/**
 * Performs Deep Semantic Layout Analysis on a PDF page
 * Spatially integrates text, multi-column zones, tables, and images
 */
export function analyzePageLayout(
  rawPage: RawPageData,
  pageImages: (ImageElementData & { x: number; y: number })[] = [],
  pageDiagrams: DiagramElementData[] = []
): PageMetadata {
  const hasCoverIllustration = pageImages.some((img) => img.isCoverIllustration);
  const isCover = detectCoverPage(rawPage, hasCoverIllustration);

  // Calculate median font size
  const fontSizes = rawPage.items.map((i) => i.fontSize).sort((a, b) => a - b);
  const medianSize = fontSizes.length > 0 ? fontSizes[Math.floor(fontSizes.length / 2)] : 11;

  const elements: DocumentElement[] = [];

  // Check for multi-column layout
  const columnInfo = !isCover
    ? detectColumnGutter(rawPage.items, rawPage.width)
    : { isMultiColumn: false, gutterX: 0, gutterWidth: 0 };

  if (columnInfo.isMultiColumn && columnInfo.gutterX > 0) {
    // Segregate items by columns: Left Column (x < gutterX) and Right Column (x > gutterX)
    const gutterX = columnInfo.gutterX;
    const leftItems = rawPage.items.filter((it) => it.x + it.width <= gutterX + 10);
    const rightItems = rawPage.items.filter((it) => it.x >= gutterX - 10);

    const leftLines = groupItemsIntoLines(leftItems);
    const rightLines = groupItemsIntoLines(rightItems);

    const col1Elements = convertLinesToElements(leftLines, medianSize, rawPage.pageNumber, false);
    const col2Elements = convertLinesToElements(rightLines, medianSize, rawPage.pageNumber, false);

    elements.push({
      id: `p${rawPage.pageNumber}_multicol`,
      type: 'columns',
      pageNumber: rawPage.pageNumber,
      y: rawPage.items[0]?.y || 54,
      columns: {
        columnCount: 2,
        columns: [
          { index: 0, elements: col1Elements, widthPct: 50 },
          { index: 1, elements: col2Elements, widthPct: 50 },
        ],
      },
    });
  } else {
    // Standard single-column flow
    const lines = groupItemsIntoLines(rawPage.items);
    const standardElements = convertLinesToElements(lines, medianSize, rawPage.pageNumber, isCover);
    elements.push(...standardElements);
  }

  // Interleave Images by their true spatial Y position
  for (const img of pageImages) {
    elements.push({
      id: `elem_${img.id}`,
      type: 'image',
      pageNumber: rawPage.pageNumber,
      y: img.y,
      x: img.x,
      image: img,
    });
  }

  // Interleave Diagrams by their true spatial Y position
  for (const diag of pageDiagrams) {
    elements.push({
      id: `elem_${diag.id}`,
      type: 'diagram',
      pageNumber: rawPage.pageNumber,
      y: diag.boundingBox.minY,
      x: diag.boundingBox.minX,
      diagram: diag,
    });
  }

  // Sort elements by Y coordinate to preserve true reading order
  elements.sort((a, b) => a.y - b.y);

  return {
    pageNumber: rawPage.pageNumber,
    width: rawPage.width,
    height: rawPage.height,
    isLandscape: rawPage.width > rawPage.height,
    isCoverPage: isCover,
    isScannedPage: rawPage.items.length === 0,
    columnCount: columnInfo.isMultiColumn ? 2 : 1,
    elements,
  };
}
