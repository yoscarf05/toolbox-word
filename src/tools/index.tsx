import React from 'react';
import { Language } from '../types';

// PDF Tools
import { PdfToWordTool } from './PdfToWordTool';
import { WordToPdfTool } from './WordToPdfTool';
import { CompressPdfTool } from './CompressPdfTool';
import { MergePdfTool } from './MergePdfTool';
import { SplitPdfTool } from './SplitPdfTool';
import { JpgToPdfTool } from './JpgToPdfTool';
import { PdfToJpgTool } from './PdfToJpgTool';

// Academic & Text Tools
import { CitationGeneratorTool } from './CitationGeneratorTool';

// Image Tools
import { CompressImageTool } from './CompressImageTool';
import { ResizeImageTool } from './ResizeImageTool';
import { JpgToWebpTool } from './JpgToWebpTool';
import { PngToWebpTool } from './PngToWebpTool';
import { FaviconGeneratorTool } from './FaviconGeneratorTool';

// QR Code Tools
import { QrGeneratorTool } from './QrGeneratorTool';
import { QrWifiTool } from './QrWifiTool';

// Text Tools
import { WordCounterTool } from './WordCounterTool';
import { TextDiffTool } from './TextDiffTool';

// Productivity Tools
import { PasswordGeneratorTool } from './PasswordGeneratorTool';
import { UnitConverterTool } from './UnitConverterTool';
import { DateDifferenceTool } from './DateDifferenceTool';

// Developer Tools
import { JsonFormatterTool } from './JsonFormatterTool';
import { Base64ConverterTool } from './Base64ConverterTool';
import { UrlEncoderTool } from './UrlEncoderTool';

export type ToolComponent = React.FC<{ lang: Language }>;

export const TOOL_COMPONENTS: Record<string, ToolComponent> = {
  'pdf-to-word': PdfToWordTool,
  'word-to-pdf': WordToPdfTool,
  'citation-generator': CitationGeneratorTool,

  'compress-pdf': CompressPdfTool,
  'merge-pdf': MergePdfTool,
  'split-pdf': SplitPdfTool,
  'jpg-to-pdf': JpgToPdfTool,
  'pdf-to-jpg': PdfToJpgTool,

  'compress-image': CompressImageTool,
  'resize-image': ResizeImageTool,
  'jpg-to-webp': JpgToWebpTool,
  'png-to-webp': PngToWebpTool,
  'favicon-generator': FaviconGeneratorTool,

  'qr-generator': QrGeneratorTool,
  'qr-wifi': QrWifiTool,

  'word-counter': WordCounterTool,
  'text-diff': TextDiffTool,

  'password-generator': PasswordGeneratorTool,
  'unit-converter': UnitConverterTool,
  'date-difference': DateDifferenceTool,

  'json-formatter': JsonFormatterTool,
  'base64-converter': Base64ConverterTool,
  'url-encoder': UrlEncoderTool,
};
