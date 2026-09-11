import JSZip from 'jszip';
import {
  PDFDocument,
  PDFFont,
  StandardFonts,
  rgb,
  PageSizes,
} from 'pdf-lib';

type RgbColor = ReturnType<typeof rgb>;

export interface DocxToPdfOptions {
  pageSize?: 'A4' | 'LETTER';
  fontFamily?: 'Helvetica' | 'Times' | 'Courier';
  includeHeader?: boolean;
  includePageNumbers?: boolean;
  marginSize?: 'normal' | 'compact' | 'wide';
}

export interface DocxParsedRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  size?: number; // in pt
  color?: string; // hex
}

export interface DocxParsedElement {
  id: string;
  type:
    | 'title'
    | 'heading1'
    | 'heading2'
    | 'heading3'
    | 'paragraph'
    | 'bullet_list'
    | 'numbered_list'
    | 'table'
    | 'image'
    | 'formula'
    | 'page_break';
  text?: string;
  runs?: DocxParsedRun[];
  listPrefix?: string;
  align?: 'left' | 'center' | 'right';
  tableData?: {
    rows: string[][];
    hasHeader?: boolean;
  };
  imageData?: Uint8Array;
  imageFormat?: 'png' | 'jpg';
  imageWidth?: number;
  imageHeight?: number;
}

export interface DocxAnalysisResult {
  fileName: string;
  elements: DocxParsedElement[];
  totalWords: number;
  totalCharacters: number;
  paragraphCount: number;
  tableCount: number;
  imageCount: number;
  estimatedPages: number;
}

/**
 * Detects mathematical equations and formulas in docx paragraphs.
 */
function isMathematicalFormula(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length > 80 || trimmed.length < 3) return false;
  if (!/[=≠≤≥≈±<>]/.test(trimmed)) return false;
  const variableMathPattern = /^[A-Za-z0-9_'\(\)]+\s*[=≠≤≥≈]\s*[A-Za-z0-9_\(\)]+(\s*[\+\-×\*\/÷\^]\s*[A-Za-z0-9_\(\)]+)*$/;
  if (variableMathPattern.test(trimmed)) return true;
  const mathChars = trimmed.match(/[=≠≤≥≈±+\-×*\/÷^√∑∫%()\[\]_]/g);
  return (mathChars ? mathChars.length : 0) >= 2 && trimmed.split(/\s+/).length <= 9;
}

/**
 * Safely encodes a string for pdf-lib's StandardFonts (WinAnsiEncoding),
 * replacing any incompatible character with an equivalent or fallback.
 */
function sanitizeForPdf(text: string, font: PDFFont): string {
  if (!text) return '';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    // Map common unicode characters to WinAnsi equivalents
    if (ch === '’' || ch === '‘') {
      result += "'";
      continue;
    }
    if (ch === '“' || ch === '”') {
      result += '"';
      continue;
    }
    if (ch === '—' || ch === '–') {
      result += '-';
      continue;
    }
    if (ch === '…') {
      result += '...';
      continue;
    }
    if (ch === '≤') {
      result += '<=';
      continue;
    }
    if (ch === '≥') {
      result += '>=';
      continue;
    }
    if (ch === '≠') {
      result += '!=';
      continue;
    }
    if (ch === '≈') {
      result += '~=';
      continue;
    }
    if (ch === 'π') {
      result += 'pi';
      continue;
    }
    if (ch === '√') {
      result += 'sqrt';
      continue;
    }
    if (ch === '→') {
      result += '->';
      continue;
    }
    if (ch === '←') {
      result += '<-';
      continue;
    }
    if (ch === '↔') {
      result += '<->';
      continue;
    }
    if (ch === '™') {
      result += '(TM)';
      continue;
    }
    if (ch === '\u200B' || ch === '\u200C' || ch === '\u200D' || ch === '\uFEFF') {
      // Zero-width characters
      continue;
    }

    try {
      font.encodeText(ch);
      result += ch;
    } catch {
      // Character not encodable in WinAnsi, substitute with space or ascii
      result += '?';
    }
  }
  return result;
}

/**
 * Converts a hex color string (e.g. "2B6CB0" or "#2B6CB0") to pdf-lib RGB.
 */
function hexToRgb(hex?: string): RgbColor {
  if (!hex) return rgb(0.1, 0.1, 0.1);
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return rgb(r, g, b);
    }
  }
  return rgb(0.1, 0.1, 0.1);
}

/**
 * Parses a DOCX (.docx) file by reading its OpenXML container.
 */
export async function parseDocxFile(
  fileBuffer: ArrayBuffer,
  fileName: string = 'documento.docx'
): Promise<DocxAnalysisResult> {
  const zip = await JSZip.loadAsync(fileBuffer);
  const documentXmlFile = zip.file('word/document.xml');
  if (!documentXmlFile) {
    throw new Error(
      'El archivo seleccionado no es un documento Microsoft Word (.docx) válido o no contiene word/document.xml.'
    );
  }

  const documentXmlText = await documentXmlFile.async('string');

  // Load relationship file to locate images in word/media/
  const relsMap: Record<string, string> = {};
  const relsFile = zip.file('word/_rels/document.xml.rels');
  if (relsFile) {
    const relsXml = await relsFile.async('string');
    const relRegex = /<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g;
    let relMatch;
    while ((relMatch = relRegex.exec(relsXml)) !== null) {
      relsMap[relMatch[1]] = relMatch[2];
    }
  }

  // Parse document.xml using DOMParser in browser environments, or regex fallback
  const elements: DocxParsedElement[] = [];
  let totalWords = 0;
  let totalCharacters = 0;
  let paragraphCount = 0;
  let tableCount = 0;
  let imageCount = 0;

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(documentXmlText, 'application/xml');
    const body = xmlDoc.getElementsByTagName('w:body')[0] || xmlDoc.getElementsByTagName('body')[0];

    if (body) {
      const childNodes = Array.from(body.childNodes);

      for (const node of childNodes) {
        const nodeName = node.nodeName;

        // TABLE HANDLING: <w:tbl>
        if (nodeName === 'w:tbl' || nodeName.endsWith(':tbl')) {
          tableCount++;
          const tableElement = node as Element;
          const rows: string[][] = [];
          const trList = tableElement.getElementsByTagName('w:tr');

          for (let r = 0; r < trList.length; r++) {
            const tr = trList[r];
            const rowCells: string[] = [];
            const tcList = tr.getElementsByTagName('w:tc');

            for (let c = 0; c < tcList.length; c++) {
              const tc = tcList[c];
              const tNodes = tc.getElementsByTagName('w:t');
              let cellText = '';
              for (let t = 0; t < tNodes.length; t++) {
                cellText += tNodes[t].textContent || '';
              }
              rowCells.push(cellText.trim());
              totalCharacters += cellText.length;
              totalWords += cellText.split(/\s+/).filter(Boolean).length;
            }

            if (rowCells.length > 0) {
              rows.push(rowCells);
            }
          }

          if (rows.length > 0) {
            elements.push({
              id: `table_${elements.length}`,
              type: 'table',
              tableData: {
                rows,
                hasHeader: true,
              },
            });
          }
          continue;
        }

        // PARAGRAPH HANDLING: <w:p>
        if (nodeName === 'w:p' || nodeName.endsWith(':p')) {
          paragraphCount++;
          const pElement = node as Element;

          // Check for images embedded inside paragraph
          const blipElements = pElement.getElementsByTagName('a:blip');
          if (blipElements.length > 0) {
            for (let b = 0; b < blipElements.length; b++) {
              const rId =
                blipElements[b].getAttribute('r:embed') ||
                blipElements[b].getAttribute('embed') ||
                '';
              const target = relsMap[rId];
              if (target) {
                // target usually "media/image1.png"
                const mediaPath = target.startsWith('media/')
                  ? `word/${target}`
                  : target.startsWith('word/')
                  ? target
                  : `word/media/${target.replace(/^.*\//, '')}`;

                const imgFile = zip.file(mediaPath);
                if (imgFile) {
                  const imgBytes = await imgFile.async('uint8array');
                  const format: 'png' | 'jpg' =
                    target.toLowerCase().endsWith('.png') ? 'png' : 'jpg';

                  imageCount++;
                  elements.push({
                    id: `img_${elements.length}`,
                    type: 'image',
                    imageData: imgBytes,
                    imageFormat: format,
                  });
                }
              }
            }
          }

          // Check for page break inside paragraph: <w:br w:type="page"/>
          const brElements = pElement.getElementsByTagName('w:br');
          let hasPageBreak = false;
          for (let br = 0; br < brElements.length; br++) {
            if (brElements[br].getAttribute('w:type') === 'page') {
              hasPageBreak = true;
              break;
            }
          }

          if (hasPageBreak) {
            elements.push({
              id: `break_${elements.length}`,
              type: 'page_break',
            });
          }

          // Determine Paragraph Style
          let pType: DocxParsedElement['type'] = 'paragraph';
          let align: DocxParsedElement['align'] = 'left';
          let listPrefix: string | undefined;

          const pPr = pElement.getElementsByTagName('w:pPr')[0];
          if (pPr) {
            const pStyle = pPr.getElementsByTagName('w:pStyle')[0];
            const styleVal = (pStyle?.getAttribute('w:val') || '').toLowerCase();

            if (styleVal.includes('title')) {
              pType = 'title';
            } else if (styleVal.includes('heading1') || styleVal === '1') {
              pType = 'heading1';
            } else if (styleVal.includes('heading2') || styleVal === '2') {
              pType = 'heading2';
            } else if (styleVal.includes('heading3') || styleVal === '3') {
              pType = 'heading3';
            }

            // Check alignment
            const jc = pPr.getElementsByTagName('w:jc')[0];
            const jcVal = jc?.getAttribute('w:val');
            if (jcVal === 'center') align = 'center';
            else if (jcVal === 'right') align = 'right';

            // Check numbering/bullet
            const numPr = pPr.getElementsByTagName('w:numPr')[0];
            if (numPr) {
              pType = 'bullet_list';
              listPrefix = '•';
            }
          }

          // Extract text runs <w:r>
          const runs: DocxParsedRun[] = [];
          const rNodes = pElement.getElementsByTagName('w:r');
          let fullParagraphText = '';

          for (let r = 0; r < rNodes.length; r++) {
            const rElem = rNodes[r];
            const tNode = rElem.getElementsByTagName('w:t')[0];
            if (!tNode) continue;

            const textVal = tNode.textContent || '';
            if (!textVal) continue;

            let isBold = false;
            let isItalic = false;
            let fontSize = 11;
            let colorHex: string | undefined;

            const rPr = rElem.getElementsByTagName('w:rPr')[0];
            if (rPr) {
              isBold = rPr.getElementsByTagName('w:b').length > 0;
              isItalic = rPr.getElementsByTagName('w:i').length > 0;

              const sz = rPr.getElementsByTagName('w:sz')[0];
              if (sz) {
                const szVal = parseInt(sz.getAttribute('w:val') || '22', 10);
                if (!isNaN(szVal) && szVal > 0) {
                  fontSize = Math.round(szVal / 2);
                }
              }

              const colorElem = rPr.getElementsByTagName('w:color')[0];
              if (colorElem) {
                colorHex = colorElem.getAttribute('w:val') || undefined;
              }
            }

            runs.push({
              text: textVal,
              bold: isBold,
              italic: isItalic,
              size: fontSize,
              color: colorHex,
            });

            fullParagraphText += textVal;
          }

          const trimmedText = fullParagraphText.trim();
          if (!trimmedText && runs.length === 0) continue;

          totalCharacters += trimmedText.length;
          totalWords += trimmedText.split(/\s+/).filter(Boolean).length;

          // Check if plain text looks like bullet list or heading or formula if not styled
          if (pType === 'paragraph') {
            const listMatch = trimmedText.match(/^([•\-\*\u2022\u25cf\u25cb]|(?:[0-9]+|[a-zA-Z])[\.\)])\s+(.*)$/);
            if (listMatch) {
              pType = /^[0-9]+[\.\)]/.test(listMatch[1]) ? 'numbered_list' : 'bullet_list';
              listPrefix = listMatch[1];
            } else if (runs.length === 1 && runs[0].bold && runs[0].size && runs[0].size >= 16) {
              pType = runs[0].size >= 20 ? 'heading1' : 'heading2';
            } else if (isMathematicalFormula(trimmedText)) {
              pType = 'formula';
              align = 'center';
            }
          }

          elements.push({
            id: `p_${elements.length}`,
            type: pType,
            text: trimmedText,
            runs,
            listPrefix,
            align,
          });
        }
      }
    }
  } else {
    // Regex fallback for environments without DOMParser
    const pRegex = /<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g;
    let match;
    while ((match = pRegex.exec(documentXmlText)) !== null) {
      const pContent = match[1];
      const textMatches = [...pContent.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map(
        (m) => m[1]
      );
      const pText = textMatches.join('').trim();
      if (pText) {
        paragraphCount++;
        totalCharacters += pText.length;
        totalWords += pText.split(/\s+/).filter(Boolean).length;
        elements.push({
          id: `p_${elements.length}`,
          type: 'paragraph',
          text: pText,
          runs: [{ text: pText, size: 11 }],
        });
      }
    }
  }

  const estimatedPages = Math.max(1, Math.ceil(totalWords / 450));

  return {
    fileName,
    elements,
    totalWords,
    totalCharacters,
    paragraphCount,
    tableCount,
    imageCount,
    estimatedPages,
  };
}

/**
 * Builds a vector-rendered, 100% compliant PDF from parsed DOCX elements.
 */
export async function buildDocxToPdf(
  analysis: DocxAnalysisResult,
  options: DocxToPdfOptions = {},
  onProgress?: (progress: number, message: string) => void
): Promise<Blob> {
  onProgress?.(15, 'Inicializando motor vectorial PDF...');

  const pdfDoc = await PDFDocument.create();
  if (analysis.fileName) {
    pdfDoc.setTitle(analysis.fileName.replace(/\.[^/.]+$/, ''));
  }

  // Embed standard typography fonts
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontBoldItalic = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  // Page Dimensions
  const isLetter = options.pageSize === 'LETTER';
  const pageWidth = isLetter ? PageSizes.Letter[0] : PageSizes.A4[0]; // 595.28 pt
  const pageHeight = isLetter ? PageSizes.Letter[1] : PageSizes.A4[1]; // 841.89 pt

  // Margins
  let margin = 54; // 0.75 inch (54 pt)
  if (options.marginSize === 'compact') margin = 36; // 0.5 inch
  if (options.marginSize === 'wide') margin = 72; // 1.0 inch

  const printableWidth = pageWidth - margin * 2;
  const bottomMargin = margin + 30; // buffer for footer

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;
  let pageIndex = 1;

  function addNewPage() {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    currentY = pageHeight - margin;
    pageIndex++;
  }

  // Pre-load embedded images if any
  const embeddedImages: Record<number, any> = {};
  for (let i = 0; i < analysis.elements.length; i++) {
    const el = analysis.elements[i];
    if (el.type === 'image' && el.imageData) {
      try {
        if (el.imageFormat === 'png') {
          embeddedImages[i] = await pdfDoc.embedPng(el.imageData);
        } else {
          embeddedImages[i] = await pdfDoc.embedJpg(el.imageData);
        }
      } catch (e) {
        console.warn('Could not embed image, skipping:', e);
      }
    }
  }

  onProgress?.(40, 'Renderizando contenido y estilos...');

  // Process elements sequentially
  for (let i = 0; i < analysis.elements.length; i++) {
    const el = analysis.elements[i];
    const progressPercent = 40 + Math.round((i / analysis.elements.length) * 45);
    onProgress?.(
      progressPercent,
      `Procesando elemento ${i + 1} de ${analysis.elements.length}...`
    );

    // MANUAL PAGE BREAK
    if (el.type === 'page_break') {
      addNewPage();
      continue;
    }

    // EMBEDDED IMAGE
    if (el.type === 'image') {
      const embeddedImg = embeddedImages[i];
      if (embeddedImg) {
        const imgDims = embeddedImg.scale(1);
        let renderWidth = imgDims.width;
        let renderHeight = imgDims.height;

        // Scale down to fit printable width if needed
        if (renderWidth > printableWidth) {
          const ratio = printableWidth / renderWidth;
          renderWidth = printableWidth;
          renderHeight = renderHeight * ratio;
        }

        // Cap height so it fits on page
        const maxImgHeight = pageHeight - margin * 2 - 60;
        if (renderHeight > maxImgHeight) {
          const ratio = maxImgHeight / renderHeight;
          renderHeight = maxImgHeight;
          renderWidth = renderWidth * ratio;
        }

        if (currentY - renderHeight < bottomMargin) {
          addNewPage();
        }

        // Center the image horizontally
        const imgX = margin + (printableWidth - renderWidth) / 2;
        currentPage.drawImage(embeddedImg, {
          x: imgX,
          y: currentY - renderHeight,
          width: renderWidth,
          height: renderHeight,
        });

        currentY -= renderHeight + 18;
      }
      continue;
    }

    // TABLE RENDERING
    if (el.type === 'table' && el.tableData && el.tableData.rows.length > 0) {
      const rows = el.tableData.rows;
      const numCols = Math.max(...rows.map((r) => r.length));
      if (numCols === 0) continue;

      const colWidth = printableWidth / numCols;
      const cellPadding = 6;
      const rowFontSize = 9.5;
      const rowLineHeight = 13;

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const isHeader = r === 0 && el.tableData.hasHeader;
        const font = isHeader ? fontBold : fontNormal;

        // Estimate row height based on cell with longest text
        let maxLines = 1;
        for (let c = 0; c < numCols; c++) {
          const rawCell = row[c] || '';
          const cleanCell = sanitizeForPdf(rawCell, font);
          const cellContentWidth = colWidth - cellPadding * 2;
          const words = cleanCell.split(/\s+/).filter(Boolean);

          let curLineWidth = 0;
          let linesInCell = 1;
          for (const w of words) {
            const wWidth = font.widthOfTextAtSize(w + ' ', rowFontSize);
            if (curLineWidth + wWidth > cellContentWidth && curLineWidth > 0) {
              linesInCell++;
              curLineWidth = wWidth;
            } else {
              curLineWidth += wWidth;
            }
          }
          if (linesInCell > maxLines) maxLines = linesInCell;
        }

        const calculatedRowHeight = Math.max(22, maxLines * rowLineHeight + cellPadding * 2);

        if (currentY - calculatedRowHeight < bottomMargin) {
          addNewPage();
        }

        // Draw row background for header
        if (isHeader) {
          currentPage.drawRectangle({
            x: margin,
            y: currentY - calculatedRowHeight,
            width: printableWidth,
            height: calculatedRowHeight,
            color: rgb(0.95, 0.96, 0.98), // slate-100
          });
        }

        // Draw row borders
        currentPage.drawLine({
          start: { x: margin, y: currentY - calculatedRowHeight },
          end: { x: margin + printableWidth, y: currentY - calculatedRowHeight },
          thickness: 0.5,
          color: rgb(0.85, 0.88, 0.92),
        });

        // Draw cell contents
        for (let c = 0; c < numCols; c++) {
          const rawCell = row[c] || '';
          const cleanCell = sanitizeForPdf(rawCell, font);
          const cellX = margin + c * colWidth + cellPadding;
          const cellContentWidth = colWidth - cellPadding * 2;

          // Word wrap in cell
          const words = cleanCell.split(/\s+/).filter(Boolean);
          let lineWords: string[] = [];
          let currentLineWidth = 0;
          let lineY = currentY - cellPadding - rowFontSize;

          for (const w of words) {
            const wWidth = font.widthOfTextAtSize(w + ' ', rowFontSize);
            if (currentLineWidth + wWidth > cellContentWidth && lineWords.length > 0) {
              currentPage.drawText(lineWords.join(' '), {
                x: cellX,
                y: lineY,
                size: rowFontSize,
                font,
                color: isHeader ? rgb(0.1, 0.15, 0.25) : rgb(0.2, 0.25, 0.3),
              });
              lineWords = [w];
              currentLineWidth = wWidth;
              lineY -= rowLineHeight;
            } else {
              lineWords.push(w);
              currentLineWidth += wWidth;
            }
          }

          if (lineWords.length > 0) {
            currentPage.drawText(lineWords.join(' '), {
              x: cellX,
              y: lineY,
              size: rowFontSize,
              font,
              color: isHeader ? rgb(0.1, 0.15, 0.25) : rgb(0.2, 0.25, 0.3),
            });
          }
        }

        currentY -= calculatedRowHeight;
      }

      currentY -= 14; // spacing after table
      continue;
    }

    // HEADINGS, LISTS, AND PARAGRAPHS
    let fontSize = 11;
    let font = fontNormal;
    let textColor = rgb(0.12, 0.14, 0.18);
    let spacingBefore = 4;
    let spacingAfter = 6;
    let indent = 0;

    switch (el.type) {
      case 'title':
        fontSize = 22;
        font = fontBold;
        textColor = rgb(0.08, 0.15, 0.28);
        spacingBefore = 8;
        spacingAfter = 14;
        break;

      case 'heading1':
        fontSize = 17;
        font = fontBold;
        textColor = rgb(0.1, 0.18, 0.35);
        spacingBefore = 14;
        spacingAfter = 8;
        break;

      case 'heading2':
        fontSize = 13.5;
        font = fontBold;
        textColor = rgb(0.15, 0.22, 0.38);
        spacingBefore = 12;
        spacingAfter = 6;
        break;

      case 'heading3':
        fontSize = 12;
        font = fontBold;
        textColor = rgb(0.2, 0.25, 0.35);
        spacingBefore = 8;
        spacingAfter = 4;
        break;

      case 'bullet_list':
      case 'numbered_list':
        fontSize = 11;
        font = fontNormal;
        indent = 20;
        spacingBefore = 2;
        spacingAfter = 4;
        break;

      case 'formula':
        fontSize = 12;
        font = fontItalic || fontNormal;
        textColor = rgb(0.06, 0.1, 0.2);
        spacingBefore = 8;
        spacingAfter = 8;
        break;

      default:
        fontSize = 11;
        font = fontNormal;
        spacingBefore = 2;
        spacingAfter = 6;
        break;
    }

    // Check if element has runs with custom styling
    const hasRuns = el.runs && el.runs.length > 0;
    const cleanFullText = sanitizeForPdf(el.text || '', font);

    if (!cleanFullText && !hasRuns) continue;

    const lineHeight = fontSize * 1.38;

    // Check vertical space for spacing before
    currentY -= spacingBefore;

    // Word Wrap & Layout
    const effectiveWidth = printableWidth - indent;
    const words = cleanFullText.split(/\s+/).filter(Boolean);

    // If it is a list, draw the bullet/prefix at the left
    if (indent > 0) {
      if (currentY - lineHeight < bottomMargin) {
        addNewPage();
      }
      const prefix = el.listPrefix || '•';
      currentPage.drawText(sanitizeForPdf(prefix, fontBold), {
        x: margin + 4,
        y: currentY,
        size: fontSize,
        font: fontBold,
        color: textColor,
      });
    }

    let currentLineWords: string[] = [];
    let currentLineWidth = 0;

    for (let wIdx = 0; wIdx < words.length; wIdx++) {
      const word = words[wIdx];
      const wordWidth = font.widthOfTextAtSize(word + ' ', fontSize);

      if (currentLineWidth + wordWidth > effectiveWidth && currentLineWords.length > 0) {
        // Check page boundary
        if (currentY - lineHeight < bottomMargin) {
          addNewPage();
        }

        const lineText = currentLineWords.join(' ');
        let startX = margin + indent;
        if (el.align === 'center') {
          const actualW = font.widthOfTextAtSize(lineText, fontSize);
          startX = margin + (printableWidth - actualW) / 2;
        } else if (el.align === 'right') {
          const actualW = font.widthOfTextAtSize(lineText, fontSize);
          startX = margin + printableWidth - actualW;
        }

        currentPage.drawText(lineText, {
          x: startX,
          y: currentY,
          size: fontSize,
          font,
          color: textColor,
        });

        currentY -= lineHeight;
        currentLineWords = [word];
        currentLineWidth = wordWidth;
      } else {
        currentLineWords.push(word);
        currentLineWidth += wordWidth;
      }
    }

    // Draw remaining line
    if (currentLineWords.length > 0) {
      if (currentY - lineHeight < bottomMargin) {
        addNewPage();
      }

      const lineText = currentLineWords.join(' ');
      let startX = margin + indent;
      if (el.align === 'center') {
        const actualW = font.widthOfTextAtSize(lineText, fontSize);
        startX = margin + (printableWidth - actualW) / 2;
      } else if (el.align === 'right') {
        const actualW = font.widthOfTextAtSize(lineText, fontSize);
        startX = margin + printableWidth - actualW;
      }

      currentPage.drawText(lineText, {
        x: startX,
        y: currentY,
        size: fontSize,
        font,
        color: textColor,
      });

      currentY -= lineHeight;
    }

    currentY -= spacingAfter;
  }

  onProgress?.(96, 'Empaquetando documento PDF final...');

  const pdfBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Validates that a generated PDF is a genuine, non-corrupted PDF.
 */
export async function validateGeneratedPdf(blob: Blob): Promise<{
  isValid: boolean;
  error?: string;
  pageCount?: number;
  byteSize: number;
}> {
  if (!blob || blob.size < 500) {
    return {
      isValid: false,
      error: 'El archivo PDF generado es inferior a 500 bytes o está vacío.',
      byteSize: blob?.size || 0,
    };
  }

  try {
    const arrayBuffer = await blob.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const header = String.fromCharCode(...bytes.subarray(0, 5));

    if (header !== '%PDF-') {
      return {
        isValid: false,
        error: 'El archivo generado no contiene la cabecera estándar de PDF (%PDF-).',
        byteSize: blob.size,
      };
    }

    const fullBuffer = await blob.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fullBuffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();

    if (pageCount === 0) {
      return {
        isValid: false,
        error: 'El archivo PDF no contiene ninguna página válida.',
        byteSize: blob.size,
      };
    }

    return {
      isValid: true,
      pageCount,
      byteSize: blob.size,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: err?.message || 'Error al validar la estructura interna del archivo PDF.',
      byteSize: blob.size,
    };
  }
}
