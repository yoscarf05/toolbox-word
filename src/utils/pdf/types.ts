/**
 * Enhanced PDF Structure Types for Professional Document Reconstruction
 */

export type ElementType =
  | 'cover_title'
  | 'cover_subtitle'
  | 'cover_meta'
  | 'title'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'paragraph'
  | 'bullet_list'
  | 'numbered_list'
  | 'table'
  | 'image'
  | 'diagram'
  | 'formula'
  | 'columns'
  | 'scanned_composite';

export interface TextStyle {
  fontName?: string;
  fontSize: number; // in points (pt)
  bold: boolean;
  italic: boolean;
  underline?: boolean;
  colorHex?: string; // e.g. '1E293B'
}

export interface TextRunItem {
  text: string;
  style: TextStyle;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TableCellData {
  text: string;
  runs: TextRunItem[];
  colSpan?: number;
  rowSpan?: number;
  isHeader?: boolean;
  align?: 'left' | 'center' | 'right' | 'justify';
  bgHex?: string;
}

export interface TableRowData {
  cells: TableCellData[];
  isHeader?: boolean;
}

export interface TableElementData {
  rows: TableRowData[];
  columnCount: number;
  columnWidthsPct: number[]; // e.g. [30, 40, 30]
  hasBorders: boolean;
}

export interface ImageElementData {
  id: string;
  imageData: Uint8Array;
  mimeType: 'image/png' | 'image/jpeg';
  widthPt: number;
  heightPt: number;
  aspectRatio: number;
  caption?: string;
  isCoverIllustration?: boolean;
}

export interface DiagramElementData {
  id: string;
  imageData: Uint8Array; // Rendered high-resolution snapshot of the vector region
  widthPt: number;
  heightPt: number;
  caption?: string;
  boundingBox: { minX: number; minY: number; maxX: number; maxY: number };
}

export interface ColumnData {
  index: number;
  elements: DocumentElement[];
  widthPct: number;
}

export interface MultiColumnElementData {
  columnCount: number;
  columns: ColumnData[];
}

export interface FormulaElementData {
  rawFormula: string;
  isBlockEquation: boolean;
}

export interface DocumentElement {
  id: string;
  type: ElementType;
  pageNumber: number;
  y: number; // Vertical position in points from top of page
  x?: number; // Horizontal position in points from left
  width?: number;
  height?: number;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  // Text content
  text?: string;
  runs?: TextRunItem[];
  // Specialized element data
  table?: TableElementData;
  image?: ImageElementData;
  diagram?: DiagramElementData;
  columns?: MultiColumnElementData;
  formula?: FormulaElementData;
}

export interface PageMetadata {
  pageNumber: number;
  width: number; // in pt
  height: number; // in pt
  isLandscape: boolean;
  isCoverPage: boolean;
  isScannedPage: boolean;
  columnCount: number;
  elements: DocumentElement[];
  ocrText?: string;
}

export interface DocumentAnalysisResult {
  fileName: string;
  pageCount: number;
  hasCoverPage: boolean;
  hasImages: boolean;
  hasDiagrams: boolean;
  hasTables: boolean;
  hasMultiColumns: boolean;
  hasFormulas: boolean;
  hasScannedPages: boolean;
  isEntirelyScanned?: boolean;
  totalWords: number;
  pages: PageMetadata[];
  allElements: DocumentElement[];
  metadata?: {
    title?: string;
    author?: string;
    creator?: string;
    creationDate?: string;
  };
}

export interface ConversionOptions {
  fontFamily?: 'Calibri' | 'Arial' | 'Times New Roman' | 'Aptos';
  lineSpacingMultiplier?: number;
  preservePageBreaks?: boolean;
  includePageBreaks?: boolean;
  addHeaderInfo?: boolean;
  enableOcr?: boolean;
  renderDiagrams?: boolean;
}

export const PDF_TYPES_LOADED = true;
