/**
 * Advanced Layout Detector for PDF Documents
 * Detects cover pages, columns, tables, formulas, lists, and hierarchy.
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
} from './types.ts';

interface RawItem {
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

/**
 * Checks if text contains common mathematical / scientific symbols
 */
export function isMathExpression(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;

  // Obvious math symbols
  const mathSymbols = /[=∫∑√±×÷∂∇λπθαβγσεω≈≠≤≥∞]/;
  // Patterns like E = mc^2 or f(x) = ... or x_1 + x_2
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
 * Detects if the first page qualifies as a dedicated Cover Page (Portada)
 */
export function detectCoverPage(rawPage: RawPageData): boolean {
  if (rawPage.pageNumber !== 1 || rawPage.items.length === 0) return false;

  const fontSizes = rawPage.items.map((i) => i.fontSize);
  const maxFontSize = Math.max(...fontSizes);
  const totalWords = rawPage.items.reduce((acc, it) => acc + it.str.trim().split(/\s+/).length, 0);

  const allText = rawPage.items.map((it) => it.str).join(' ').toLowerCase();

  // Content pages with section markers are NOT cover pages
  if (
    allText.includes('sección') ||
    allText.includes('seccion') ||
    allText.includes('subsección') ||
    allText.includes('subseccion') ||
    allText.includes('capítulo') ||
    allText.includes('capitulo') ||
    /\b(1\.1|1\.2|2\.1)\b/.test(allText)
  ) {
    return false;
  }

  // Cover pages typically have:
  // 1. Very prominent title (>= 22pt)
  // 2. Low word count (< 140 words)
  // 3. Cover-related metadata (author, university, thesis, project, date, etc.)
  const hasCoverTitle = maxFontSize >= 22;
  const isSparse = totalWords < 140;
  const hasCoverKeywords =
    /autor|universidad|facultad|departamento|director|tesis|proyecto|instituto|septiembre|octubre|noviembre|diciembre|enero|febrero|marzo|abril|mayo|junio|julio|agosto|202[0-9]|author|university/i.test(
      allText
    );

  return hasCoverTitle && isSparse && hasCoverKeywords;
}

/**
 * Groups raw text items on a page into horizontal lines
 */
function groupItemsIntoLines(items: RawItem[]): { y: number; items: RawItem[] }[] {
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
 * Detects multi-column layout on a page.
 * Returns column boundaries if page has 2 or 3 distinct vertical columns with a gutter.
 */
export function detectColumns(
  items: RawItem[],
  pageWidth: number,
  margin: number
): { isMultiColumn: boolean; columnCount: number; gutters: number[] } {
  if (items.length < 15) {
    return { isMultiColumn: false, columnCount: 1, gutters: [] };
  }

  const printableWidth = pageWidth - margin * 2;
  const bucketSize = 10; // 10pt bins
  const numBuckets = Math.ceil(pageWidth / bucketSize);
  const histogram = new Array(numBuckets).fill(0);

  // Populate horizontal text coverage histogram
  for (const item of items) {
    const startBucket = Math.max(0, Math.floor(item.x / bucketSize));
    const endBucket = Math.min(numBuckets - 1, Math.floor((item.x + item.width) / bucketSize));
    for (let b = startBucket; b <= endBucket; b++) {
      histogram[b]++;
    }
  }

  // Find gutters: regions in the middle of printable area with very low text count
  const minGutterWidth = 20; // 20pt gap
  const centerMin = margin + printableWidth * 0.35;
  const centerMax = margin + printableWidth * 0.65;

  let gutterStart: number | null = null;
  let maxGutter: { x: number; width: number } | null = null;

  for (let x = Math.floor(centerMin); x <= Math.floor(centerMax); x += bucketSize) {
    const b = Math.floor(x / bucketSize);
    const count = histogram[b] || 0;

    // A gutter has minimal or zero text items
    if (count <= 1) {
      if (gutterStart === null) gutterStart = x;
    } else {
      if (gutterStart !== null) {
        const width = x - gutterStart;
        if (width >= minGutterWidth) {
          if (!maxGutter || width > maxGutter.width) {
            maxGutter = { x: gutterStart + width / 2, width };
          }
        }
        gutterStart = null;
      }
    }
  }

  if (maxGutter) {
    // Verify both sides have significant text
    const leftItems = items.filter((it) => it.x + it.width <= maxGutter!.x);
    const rightItems = items.filter((it) => it.x >= maxGutter!.x);

    if (leftItems.length > 8 && rightItems.length > 8) {
      return {
        isMultiColumn: true,
        columnCount: 2,
        gutters: [maxGutter.x],
      };
    }
  }

  return { isMultiColumn: false, columnCount: 1, gutters: [] };
}

/**
 * Detects tabular data from aligned text lines
 */
function detectTableFromLines(
  lines: { y: number; items: RawItem[] }[],
  startIndex: number
): { table: TableElementData; consumedCount: number } | null {
  if (startIndex >= lines.length - 1) return null;

  // A table row must have 2 or more distinct horizontally separated cells
  const candidateRows: { y: number; cells: { text: string; x: number; width: number; runs: TextRunItem[] }[] }[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    // Filter meaningful items
    const lineItems = line.items.filter((it) => it.str.trim().length > 0);
    if (lineItems.length < 2) break;

    // Cluster items into cells based on distance
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

      // If gap is significant (> 18pt), start a new cell
      if (gap > 18) {
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

    // If this row has at least 2 distinct cells, add it
    if (cells.length >= 2) {
      candidateRows.push({ y: line.y, cells });
    } else {
      break;
    }
  }

  // Require at least 2 consecutive rows to form a real table
  if (candidateRows.length < 2) return null;

  // Determine uniform column count (use max or mode)
  const colCount = Math.max(...candidateRows.map((r) => r.cells.length));
  if (colCount < 2) return null;

  const rows: TableRowData[] = candidateRows.map((r, rIdx) => {
    const tableCells: TableCellData[] = r.cells.map((c) => ({
      text: c.text,
      runs: c.runs,
      isHeader: rIdx === 0,
      align: isNumeric(c.text) ? 'right' : 'left',
    }));

    // Pad if shorter than colCount
    while (tableCells.length < colCount) {
      tableCells.push({ text: '', runs: [] });
    }

    return {
      isHeader: rIdx === 0,
      cells: tableCells,
    };
  });

  const pctPerCol = Math.floor(100 / colCount);
  const columnWidthsPct = new Array(colCount).fill(pctPerCol);

  return {
    table: {
      rows,
      columnCount: colCount,
      columnWidthsPct,
      hasBorders: true,
    },
    consumedCount: candidateRows.length,
  };
}

function isNumeric(str: string): boolean {
  const clean = str.replace(/[$,.%€£\-\s]/g, '');
  return clean.length > 0 && !isNaN(Number(clean));
}

function rawItemToRun(item: RawItem): TextRunItem {
  return {
    text: item.str,
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
    style: {
      fontSize: item.fontSize,
      fontName: item.fontName,
      bold: item.bold,
      italic: item.italic,
      colorHex: item.colorHex || '1E293B',
    },
  };
}

/**
 * Builds high-level structured DocumentElements from raw page items
 */
export function analyzePageLayout(rawPage: RawPageData): PageMetadata {
  const isCover = detectCoverPage(rawPage);
  const lines = groupItemsIntoLines(rawPage.items);

  // Calculate median font size for relative heading classification
  const fontSizes = rawPage.items.map((i) => i.fontSize).sort((a, b) => a - b);
  const medianSize = fontSizes.length > 0 ? fontSizes[Math.floor(fontSizes.length / 2)] : 11;

  const elements: DocumentElement[] = [];

  // Check for multi-column regions (only on non-cover pages)
  const columnInfo = !isCover
    ? detectColumns(rawPage.items, rawPage.width, 54)
    : { isMultiColumn: false, columnCount: 1, gutters: [] };

  if (columnInfo.isMultiColumn && columnInfo.gutters.length === 1) {
    const gutterX = columnInfo.gutters[0];
    const leftItems = rawPage.items.filter((it) => it.x + it.width <= gutterX);
    const rightItems = rawPage.items.filter((it) => it.x >= gutterX);

    const leftLines = groupItemsIntoLines(leftItems);
    const rightLines = groupItemsIntoLines(rightItems);

    const col1Elements = convertLinesToElements(leftLines, medianSize, rawPage.pageNumber, false);
    const col2Elements = convertLinesToElements(rightLines, medianSize, rawPage.pageNumber, false);

    elements.push({
      id: `p${rawPage.pageNumber}_multicol`,
      type: 'columns',
      pageNumber: rawPage.pageNumber,
      y: lines[0]?.y || 54,
      columns: {
        columnCount: 2,
        columns: [
          { index: 0, elements: col1Elements, widthPct: 50 },
          { index: 1, elements: col2Elements, widthPct: 50 },
        ],
      },
    });
  } else {
    // Process lines in standard sequence with table and formula detection
    const standardElements = convertLinesToElements(lines, medianSize, rawPage.pageNumber, isCover);
    elements.push(...standardElements);
  }

  return {
    pageNumber: rawPage.pageNumber,
    width: rawPage.width,
    height: rawPage.height,
    isLandscape: rawPage.width > rawPage.height,
    isCoverPage: isCover,
    isScannedPage: rawPage.items.length === 0,
    columnCount: columnInfo.columnCount,
    elements,
  };
}

/**
 * Converts a sequence of lines into typed DocumentElements
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
    // 1. Check for Table
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

    // 2. Cover page element classification
    if (isCover) {
      if (maxFontSize >= 22) {
        result.push({
          id: `p${pageNumber}_cover_title_${i}`,
          type: 'cover_title',
          pageNumber,
          y: line.y,
          text: lineText,
          runs,
          alignment: 'center',
        });
      } else if (maxFontSize >= 14) {
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

    // 4. Bullet list item
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

    // 5. Numbered list item
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

    // 6. Headings based on absolute typography standards and relative font scale
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

    // 7. Regular paragraph
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
