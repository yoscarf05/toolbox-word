/**
 * Enterprise OpenXML DOCX Document Builder
 * Assembles cover pages, multi-column layouts, tables, images, diagrams, and typography.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
  ShadingType,
} from 'docx';
import type {
  DocumentAnalysisResult,
  ConversionOptions,
  DocumentElement,
  PageMetadata,
  TableElementData,
  TextRunItem,
  MultiColumnElementData,
} from './types.ts';

/**
 * Maps alignment string to docx AlignmentType enum
 */
function getAlignment(align?: string): (typeof AlignmentType)[keyof typeof AlignmentType] {
  switch (align) {
    case 'center':
      return AlignmentType.CENTER;
    case 'right':
      return AlignmentType.RIGHT;
    case 'justify':
      return AlignmentType.JUSTIFIED;
    default:
      return AlignmentType.LEFT;
  }
}

/**
 * Sanitizes XML text strings against illegal control characters
 */
function sanitizeXmlText(text?: string): string {
  if (!text) return '';
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F]/g, '');
}

/**
 * Converts TextRunItem array into docx TextRun instances
 */
function buildRuns(
  runs: TextRunItem[] | undefined,
  fallbackText: string | undefined,
  fontFamily: string,
  extraStyle?: { italic?: boolean; bold?: boolean; colorHex?: string; sizePt?: number }
): TextRun[] {
  if (runs && runs.length > 0) {
    return runs.map((r) => {
      const fontSizePt = extraStyle?.sizePt || r.style.fontSize || 11;
      return new TextRun({
        text: sanitizeXmlText(r.text),
        font: fontFamily,
        size: Math.round(fontSizePt * 2), // docx uses half-points
        bold: extraStyle?.bold !== undefined ? extraStyle.bold : r.style.bold,
        italics: extraStyle?.italic !== undefined ? extraStyle.italic : r.style.italic,
        color: extraStyle?.colorHex || r.style.colorHex || '1E293B',
      });
    });
  }

  const cleanText = sanitizeXmlText(fallbackText || '');
  const fontSizePt = extraStyle?.sizePt || 11;
  return [
    new TextRun({
      text: cleanText,
      font: fontFamily,
      size: Math.round(fontSizePt * 2),
      bold: extraStyle?.bold || false,
      italics: extraStyle?.italic || false,
      color: extraStyle?.colorHex || '1E293B',
    }),
  ];
}

/**
 * Builds a native Microsoft Word Table (<w:tbl>)
 */
function buildWordTable(tableData: TableElementData, fontFamily: string): Table {
  const borderDefinition = {
    style: BorderStyle.SINGLE,
    size: 4, // 0.5 pt
    color: 'CBD5E1', // subtle slate-300
  };

  const rows = tableData.rows.map((row, rIdx) => {
    const isHeader = row.isHeader || rIdx === 0;

    const cells = row.cells.map((cell, cIdx) => {
      const widthPct = tableData.columnWidthsPct[cIdx] || Math.floor(100 / tableData.columnCount);

      const runs = buildRuns(cell.runs, cell.text, fontFamily, {
        bold: isHeader,
        sizePt: isHeader ? 10.5 : 10,
        colorHex: isHeader ? '0F172A' : '1E293B',
      });

      return new TableCell({
        width: {
          size: widthPct,
          type: WidthType.PERCENTAGE,
        },
        shading: isHeader
          ? {
              fill: 'F1F5F9', // light slate header background
              type: ShadingType.CLEAR,
            }
          : undefined,
        margins: {
          top: 140, // twips
          bottom: 140,
          left: 180,
          right: 180,
        },
        children: [
          new Paragraph({
            alignment: getAlignment(cell.align),
            spacing: { before: 40, after: 40, line: 240 },
            children: runs,
          }),
        ],
      });
    });

    return new TableRow({
      tableHeader: isHeader,
      children: cells,
    });
  });

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: borderDefinition,
      bottom: borderDefinition,
      left: borderDefinition,
      right: borderDefinition,
      insideHorizontal: borderDefinition,
      insideVertical: borderDefinition,
    },
    rows,
  });
}

/**
 * Builds a multi-column region using a borderless layout table
 * This guarantees perfect column alignment across all Microsoft Word and LibreOffice versions.
 */
function buildMultiColumnLayout(
  colData: MultiColumnElementData,
  fontFamily: string,
  lineSpacing: number
): Table {
  const noneBorder = {
    style: BorderStyle.NONE,
    size: 0,
    color: 'FFFFFF',
  };

  const colWidthPct = Math.floor(100 / colData.columnCount);

  const cells = colData.columns.map((col) => {
    const colChildren: (Paragraph | Table)[] = [];

    for (const elem of col.elements) {
      const generated = buildElementNode(elem, fontFamily, lineSpacing);
      if (generated) colChildren.push(generated);
    }

    if (colChildren.length === 0) {
      colChildren.push(new Paragraph({ text: '' }));
    }

    return new TableCell({
      width: {
        size: colWidthPct,
        type: WidthType.PERCENTAGE,
      },
      margins: {
        top: 60,
        bottom: 60,
        left: 120,
        right: 120,
      },
      children: colChildren,
    });
  });

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: noneBorder,
      bottom: noneBorder,
      left: noneBorder,
      right: noneBorder,
      insideHorizontal: noneBorder,
      insideVertical: noneBorder,
    },
    rows: [new TableRow({ children: cells })],
  });
}

/**
 * Builds an individual Paragraph or Table from a DocumentElement
 */
function buildElementNode(
  element: DocumentElement,
  fontFamily: string,
  lineSpacing: number,
  isPageBreakTarget: boolean = false
): Paragraph | Table | null {
  const lineSpacingTwips = Math.round(lineSpacing * 240);

  switch (element.type) {
    case 'cover_title':
      return new Paragraph({
        pageBreakBefore: isPageBreakTarget,
        alignment: AlignmentType.CENTER,
        spacing: { before: 2400, after: 720, line: lineSpacingTwips },
        children: buildRuns(element.runs, element.text, fontFamily, {
          sizePt: 26,
          bold: true,
          colorHex: '0F172A',
        }),
      });

    case 'cover_subtitle':
      return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 1440, line: lineSpacingTwips },
        children: buildRuns(element.runs, element.text, fontFamily, {
          sizePt: 15,
          colorHex: '475569',
        }),
      });

    case 'cover_meta':
      return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 480, after: 240, line: lineSpacingTwips },
        children: buildRuns(element.runs, element.text, fontFamily, {
          sizePt: 11,
          colorHex: '64748B',
        }),
      });

    case 'heading1':
      return new Paragraph({
        pageBreakBefore: isPageBreakTarget,
        heading: HeadingLevel.HEADING_1,
        alignment: getAlignment(element.alignment),
        spacing: { before: 480, after: 200, line: lineSpacingTwips },
        children: buildRuns(element.runs, element.text, fontFamily, {
          sizePt: 18,
          bold: true,
          colorHex: '0F172A',
        }),
      });

    case 'heading2':
      return new Paragraph({
        pageBreakBefore: isPageBreakTarget,
        heading: HeadingLevel.HEADING_2,
        alignment: getAlignment(element.alignment),
        spacing: { before: 360, after: 160, line: lineSpacingTwips },
        children: buildRuns(element.runs, element.text, fontFamily, {
          sizePt: 14,
          bold: true,
          colorHex: '1E293B',
        }),
      });

    case 'heading3':
      return new Paragraph({
        pageBreakBefore: isPageBreakTarget,
        heading: HeadingLevel.HEADING_3,
        alignment: getAlignment(element.alignment),
        spacing: { before: 280, after: 120, line: lineSpacingTwips },
        children: buildRuns(element.runs, element.text, fontFamily, {
          sizePt: 12,
          bold: true,
          colorHex: '334155',
        }),
      });

    case 'bullet_list':
      return new Paragraph({
        bullet: { level: 0 },
        spacing: { before: 60, after: 60, line: lineSpacingTwips },
        children: buildRuns(element.runs, element.text, fontFamily),
      });

    case 'numbered_list':
      return new Paragraph({
        spacing: { before: 60, after: 60, line: lineSpacingTwips },
        indent: { left: 400 },
        children: [
          new TextRun({
            text: '•  ',
            font: fontFamily,
            bold: true,
            color: '2563EB',
          }),
          ...buildRuns(element.runs, element.text, fontFamily),
        ],
      });

    case 'formula':
      return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 280, after: 280 },
        children: [
          new TextRun({
            text: sanitizeXmlText(element.formula?.rawFormula || element.text || ''),
            font: 'Cambria Math',
            size: 24, // 12pt
            italics: true,
            color: '0F172A',
          }),
        ],
      });

    case 'table':
      if (element.table) {
        return buildWordTable(element.table, fontFamily);
      }
      return null;

    case 'columns':
      if (element.columns) {
        return buildMultiColumnLayout(element.columns, fontFamily, lineSpacing);
      }
      return null;

    case 'image':
      if (element.image) {
        return new Paragraph({
          pageBreakBefore: isPageBreakTarget,
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 240 },
          children: [
            new ImageRun({
              data: element.image.imageData,
              transformation: {
                width: Math.round(element.image.widthPt),
                height: Math.round(element.image.heightPt),
              },
              type: 'png',
            }),
          ],
        });
      }
      return null;

    case 'diagram':
      if (element.diagram) {
        return new Paragraph({
          pageBreakBefore: isPageBreakTarget,
          alignment: AlignmentType.CENTER,
          spacing: { before: 280, after: 280 },
          children: [
            new ImageRun({
              data: element.diagram.imageData,
              transformation: {
                width: Math.round(element.diagram.widthPt),
                height: Math.round(element.diagram.heightPt),
              },
              type: 'png',
            }),
          ],
        });
      }
      return null;

    case 'paragraph':
    default:
      return new Paragraph({
        pageBreakBefore: isPageBreakTarget,
        alignment: getAlignment(element.alignment),
        spacing: { before: 80, after: 120, line: lineSpacingTwips },
        children: buildRuns(element.runs, element.text, fontFamily),
      });
  }
}

/**
 * Main DOCX Document Generator
 */
export async function buildEnterpriseDocx(
  analysis: DocumentAnalysisResult,
  options: ConversionOptions = {},
  onProgress?: (pct: number, msg: string) => void
): Promise<Blob> {
  const fontFamily = options.fontFamily || 'Calibri';
  const lineSpacing = options.lineSpacingMultiplier || 1.25;
  const preservePageBreaks = options.preservePageBreaks !== false;

  onProgress?.(10, 'Ensamblando estructura OpenXML...');

  const docChildren: (Paragraph | Table)[] = [];

  // Iterate pages and assemble elements
  for (let pIdx = 0; pIdx < analysis.pages.length; pIdx++) {
    const page = analysis.pages[pIdx];
    const isFirstPage = pIdx === 0;

    onProgress?.(
      Math.round(10 + (pIdx / analysis.pages.length) * 70),
      `Procesando página ${pIdx + 1} de ${analysis.pages.length}...`
    );

    // If it's a scanned page with OCR text
    if (page.isScannedPage && page.ocrText) {
      const ocrLines = page.ocrText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      for (let lIdx = 0; lIdx < ocrLines.length; lIdx++) {
        const isFirst = lIdx === 0 && !isFirstPage && preservePageBreaks;
        docChildren.push(
          new Paragraph({
            pageBreakBefore: isFirst,
            spacing: { before: 80, after: 120 },
            children: [
              new TextRun({
                text: sanitizeXmlText(ocrLines[lIdx]),
                font: fontFamily,
                size: 22,
                color: '1E293B',
              }),
            ],
          })
        );
      }
      continue;
    }

    // Process all elements on this page
    for (let eIdx = 0; eIdx < page.elements.length; eIdx++) {
      const elem = page.elements[eIdx];
      const isFirstElementOfNewPage = eIdx === 0 && !isFirstPage && preservePageBreaks;

      const node = buildElementNode(elem, fontFamily, lineSpacing, isFirstElementOfNewPage);
      if (node) {
        docChildren.push(node);
      }
    }
  }

  // If no elements were produced (fallback safeguard)
  if (docChildren.length === 0) {
    docChildren.push(
      new Paragraph({
        text: sanitizeXmlText(analysis.fileName || 'Documento'),
        heading: HeadingLevel.HEADING_1,
      })
    );
  }

  onProgress?.(85, 'Generando archivo binario DOCX (.docx)...');

  // Standard A4 dimensions: 11906 x 16838 twips (8.27 x 11.69 in)
  // Standard margins: 1440 twips (1 inch)
  const doc = new Document({
    creator: '', // Zero branding
    description: '',
    title: analysis.metadata?.title || analysis.fileName,
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906,
              height: 16838,
            },
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  onProgress?.(95, 'Empaquetando contenedor OpenXML...');
  const buffer = await Packer.toBlob(doc);
  return buffer;
}
