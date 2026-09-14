import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';
import { extractCitationFromInput } from '../services/citationExtractor';
import { useAuth } from '../context/AuthContext';
import { ToolVisualIllustration } from '../components/ToolVisualIllustration';
import { 
  BookOpen, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  ExternalLink,
  FileText,
  Search,
  RefreshCw,
  Bookmark,
  CheckCircle2,
  Globe,
  Share2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ListOrdered
} from 'lucide-react';

export type CitationStyle = 'apa' | 'mla' | 'chicago' | 'harvard' | 'vancouver' | 'ieee';

export type SourceType = 
  | 'website'
  | 'book' 
  | 'journal' 
  | 'magazine' 
  | 'newspaper' 
  | 'thesis' 
  | 'pdf' 
  | 'video' 
  | 'organization' 
  | 'social' 
  | 'other';

export interface CitationItem {
  id: string;
  url: string;
  sourceType: SourceType;
  isLoading: boolean;
  error?: string;
  metadata: {
    title: string;
    authors: string;
    year: string;
    publicationDate: string;
    siteName: string;
    publisher: string;
    journalName: string;
    volume: string;
    issue: string;
    pages: string;
    url: string;
    doi: string;
    institution: string;
    platform: string;
    accessDate: string;
  };
  inTextCitation: string;
  fullReference: string;
  isExpanded?: boolean;
}

interface CitationGeneratorToolProps {
  lang: Language;
}

// Helper to format citation into specified academic style
export function formatCitation(
  meta: CitationItem['metadata'],
  sourceType: SourceType,
  style: CitationStyle,
  isEs: boolean
): { inText: string; full: string } {
  const authorList = (meta.authors || '').trim();
  const cleanYear = (meta.year || '').trim() || (isEs ? 's.f.' : 'n.d.');
  const cleanTitle = (meta.title || '').trim() || (isEs ? 'Sin título' : 'Untitled');
  const cleanPublisher = (meta.publisher || '').trim();
  const cleanSiteName = (meta.siteName || cleanPublisher || '').trim();
  const cleanJournal = (meta.journalName || '').trim();
  const cleanVolume = (meta.volume || '').trim();
  const cleanIssue = (meta.issue || '').trim();
  const cleanPages = (meta.pages || '').trim();
  const cleanUrl = (meta.url || '').trim();
  const cleanDoi = (meta.doi || '').trim();
  const accessDate = meta.accessDate || new Date().toISOString().split('T')[0];
  const typeVal = sourceType || 'website';

  // Primary surname for in-text citations
  let firstAuthorSurname = isEs ? 'Autor' : 'Author';
  if (authorList) {
    if (authorList.includes(',')) {
      firstAuthorSurname = authorList.split(',')[0].trim();
    } else {
      const parts = authorList.split(/\s+/);
      firstAuthorSurname = parts[parts.length - 1];
    }
  } else if (cleanSiteName) {
    firstAuthorSurname = cleanSiteName;
  }

  let inText = '';
  let full = '';

  switch (style) {
    case 'apa': {
      // APA 7th Edition
      inText = `(${firstAuthorSurname}, ${cleanYear})`;
      if (typeVal === 'website') {
        full = `${authorList || cleanSiteName} (${cleanYear}). *${cleanTitle}*. ${cleanSiteName && cleanSiteName !== authorList ? `${cleanSiteName}. ` : ''}${cleanUrl ? `${isEs ? 'Recuperado de ' : 'Retrieved from '}${cleanUrl}` : ''}`;
      } else if (typeVal === 'book') {
        full = `${authorList} (${cleanYear}). *${cleanTitle}*${cleanPublisher ? `. ${cleanPublisher}` : ''}${cleanDoi ? `. https://doi.org/${cleanDoi}` : ''}.`;
      } else if (typeVal === 'journal') {
        const volIssue = cleanVolume ? `, *${cleanVolume}*${cleanIssue ? `(${cleanIssue})` : ''}` : '';
        const pgs = cleanPages ? `, ${cleanPages}` : '';
        full = `${authorList} (${cleanYear}). ${cleanTitle}. *${cleanJournal}*${volIssue}${pgs}.${cleanDoi ? ` https://doi.org/${cleanDoi}` : cleanUrl ? ` ${cleanUrl}` : ''}`;
      } else if (typeVal === 'newspaper') {
        full = `${authorList || cleanSiteName} (${meta.publicationDate || cleanYear}). ${cleanTitle}. *${cleanSiteName || (isEs ? 'Periódico' : 'Newspaper')}*.${cleanUrl ? ` ${cleanUrl}` : ''}`;
      } else if (typeVal === 'thesis') {
        full = `${authorList} (${cleanYear}). *${cleanTitle}* [${isEs ? 'Tesis' : 'Thesis'}, ${meta.institution || (isEs ? 'Universidad' : 'University')}]. Repositorio institucional.${cleanUrl ? ` ${cleanUrl}` : ''}`;
      } else if (typeVal === 'video') {
        full = `${authorList || (isEs ? 'Canal' : 'Channel')} (${cleanYear}). *${cleanTitle}* [Video]. ${meta.platform || 'YouTube'}.${cleanUrl ? ` ${cleanUrl}` : ''}`;
      } else if (typeVal === 'organization') {
        full = `${authorList || cleanSiteName} (${cleanYear}). *${cleanTitle}*. ${cleanSiteName}.${cleanUrl ? ` ${cleanUrl}` : ''}`;
      } else {
        full = `${authorList || cleanSiteName} (${cleanYear}). *${cleanTitle}*. ${cleanPublisher ? `${cleanPublisher}. ` : ''}${cleanDoi ? `https://doi.org/${cleanDoi}` : cleanUrl || ''}`;
      }
      break;
    }

    case 'mla': {
      // MLA 9th Edition
      inText = `(${firstAuthorSurname} ${cleanPages ? cleanPages.split('-')[0].trim() : cleanYear})`;
      if (typeVal === 'website') {
        full = `${authorList || cleanSiteName}. "${cleanTitle}." *${cleanSiteName || (isEs ? 'Sitio Web' : 'Website')}*, ${cleanYear}, ${cleanUrl || ''}.`;
      } else if (typeVal === 'book') {
        full = `${authorList}. *${cleanTitle}*. ${cleanPublisher || (isEs ? 'Editorial' : 'Publisher')}, ${cleanYear}.`;
      } else if (typeVal === 'journal') {
        const vol = cleanVolume ? `, vol. ${cleanVolume}` : '';
        const iss = cleanIssue ? `, no. ${cleanIssue}` : '';
        const pgs = cleanPages ? `, pp. ${cleanPages}` : '';
        full = `${authorList}. "${cleanTitle}." *${cleanJournal}*${vol}${iss}, ${cleanYear}${pgs}.${cleanDoi ? ` https://doi.org/${cleanDoi}` : cleanUrl ? ` ${cleanUrl}` : ''}`;
      } else if (typeVal === 'newspaper') {
        full = `${authorList || cleanSiteName}. "${cleanTitle}." *${cleanSiteName}*, ${meta.publicationDate || cleanYear}, ${cleanUrl || ''}.`;
      } else {
        full = `${authorList || cleanSiteName}. *${cleanTitle}*. ${cleanPublisher ? `${cleanPublisher}, ` : ''}${cleanYear}.`;
      }
      break;
    }

    case 'chicago': {
      // Chicago Author-Date 17th
      inText = `(${firstAuthorSurname} ${cleanYear})`;
      if (typeVal === 'website') {
        full = `${authorList || cleanSiteName}. ${cleanYear}. "${cleanTitle}." ${cleanSiteName}. ${isEs ? 'Accedido el ' : 'Accessed '}${accessDate}. ${cleanUrl || ''}.`;
      } else if (typeVal === 'book') {
        full = `${authorList}. ${cleanYear}. *${cleanTitle}*${cleanPublisher ? `. ${cleanPublisher}` : ''}.`;
      } else if (typeVal === 'journal') {
        const volIssue = cleanVolume ? ` ${cleanVolume}${cleanIssue ? `, no. ${cleanIssue}` : ''}` : '';
        const pgs = cleanPages ? `: ${cleanPages}` : '';
        full = `${authorList}. ${cleanYear}. "${cleanTitle}." *${cleanJournal}*${volIssue}${pgs}.${cleanDoi ? ` https://doi.org/${cleanDoi}` : ''}`;
      } else {
        full = `${authorList || cleanSiteName}. ${cleanYear}. "${cleanTitle}." ${cleanPublisher ? `${cleanPublisher}. ` : ''}${cleanUrl || ''}`;
      }
      break;
    }

    case 'harvard': {
      // Harvard Style
      inText = `(${firstAuthorSurname}, ${cleanYear})`;
      if (typeVal === 'website') {
        full = `${authorList || cleanSiteName} (${cleanYear}) *${cleanTitle}*. ${isEs ? 'Disponible en: ' : 'Available at: '}${cleanUrl || 'Online'} (${isEs ? 'Accedido: ' : 'Accessed: '}${accessDate}).`;
      } else if (typeVal === 'journal') {
        full = `${authorList} (${cleanYear}) '${cleanTitle}', *${cleanJournal}*, ${cleanVolume || ''}${cleanIssue ? `(${cleanIssue})` : ''}, pp. ${cleanPages || ''}.`;
      } else {
        full = `${authorList || cleanSiteName} (${cleanYear}) *${cleanTitle}*. ${cleanPublisher ? `${cleanPublisher}.` : ''}`;
      }
      break;
    }

    case 'vancouver': {
      // Vancouver
      inText = `(1)`;
      if (typeVal === 'website') {
        full = `${authorList || cleanSiteName}. ${cleanTitle} [Internet]. ${cleanSiteName}; ${cleanYear} [${isEs ? 'citado el ' : 'cited '}${accessDate}]. ${isEs ? 'Disponible en: ' : 'Available from: '}${cleanUrl || ''}`;
      } else if (typeVal === 'journal') {
        full = `${authorList}. ${cleanTitle}. ${cleanJournal}. ${cleanYear};${cleanVolume || ''}${cleanIssue ? `(${cleanIssue})` : ''}:${cleanPages || ''}.`;
      } else {
        full = `${authorList || cleanSiteName}. ${cleanTitle}. ${cleanPublisher ? `${cleanPublisher}; ` : ''}${cleanYear}.`;
      }
      break;
    }

    case 'ieee': {
      // IEEE
      inText = `[1]`;
      if (typeVal === 'website') {
        full = `${authorList || cleanSiteName}, "${cleanTitle}," ${cleanSiteName}, ${cleanYear}. [${isEs ? 'En línea' : 'Online'}]. ${isEs ? 'Disponible: ' : 'Available: '}${cleanUrl || ''}. [${isEs ? 'Accedido: ' : 'Accessed: '}${accessDate}].`;
      } else if (typeVal === 'journal') {
        full = `${authorList}, "${cleanTitle}," *${cleanJournal}*, vol. ${cleanVolume || '1'}, no. ${cleanIssue || '1'}, pp. ${cleanPages || '1'}, ${cleanYear}.`;
      } else {
        full = `${authorList || cleanSiteName}, *${cleanTitle}*. ${cleanPublisher || (isEs ? 'Editorial' : 'Publisher')}, ${cleanYear}.`;
      }
      break;
    }
  }

  return { inText, full };
}

// URL Validation and Normalization
function normalizeAndValidateUrl(rawInput: string): { isValid: boolean; normalizedUrl: string; error?: string } {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { isValid: false, normalizedUrl: '', error: 'La URL no puede estar vacía.' };
  }

  // Handle DOI input e.g. 10.1016/...
  if (/^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/i.test(trimmed)) {
    return { isValid: true, normalizedUrl: `https://doi.org/${trimmed}` };
  }

  let testUrl = trimmed;
  if (!/^https?:\/\//i.test(testUrl)) {
    testUrl = `https://${testUrl}`;
  }

  try {
    const parsed = new URL(testUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { isValid: false, normalizedUrl: '', error: 'Protocolo de URL no soportado.' };
    }
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return { isValid: false, normalizedUrl: '', error: 'Dominio o enlace no válido.' };
    }
    return { isValid: true, normalizedUrl: parsed.href };
  } catch {
    return { isValid: false, normalizedUrl: '', error: 'Formato de URL no válido.' };
  }
}

export const CitationGeneratorTool: React.FC<CitationGeneratorToolProps> = ({ lang }) => {
  const { saveCitation, addHistoryItem } = useAuth();
  const isEs = lang === 'es';

  // Selected Style (Applied to all citations dynamically)
  const [style, setStyle] = useState<CitationStyle>('apa');

  // Input state
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Accumulated list of citations (multi-URL support)
  const [citations, setCitations] = useState<CitationItem[]>([]);

  // Feedback states
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const [savedItemId, setSavedItemId] = useState<string | null>(null);

  // Record tool history on mount
  useEffect(() => {
    addHistoryItem({
      type: 'tool',
      title: isEs ? 'Generador de Citas y Referencias' : 'Citation & Reference Generator',
      slug: 'citation-generator',
      meta: 'APA 7 / MLA 9 / Chicago / Vancouver'
    });
  }, []);

  // Update inText and fullReference across all accumulated citations when the citation style changes
  useEffect(() => {
    setCitations((prevList) =>
      prevList.map((item) => {
        const { inText, full } = formatCitation(item.metadata, item.sourceType, style, isEs);
        return {
          ...item,
          inTextCitation: inText,
          fullReference: full
        };
      })
    );
  }, [style, isEs]);

  // Handle adding a new citation URL
  const handleAddCitation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUrlError(null);

    const { isValid, normalizedUrl, error } = normalizeAndValidateUrl(urlInput);
    if (!isValid || !normalizedUrl) {
      setUrlError(
        isEs
          ? error || 'Introduce una URL válida (ej: https://ejemplo.com/articulo).'
          : 'Please enter a valid URL (e.g. https://example.com/article).'
      );
      return;
    }

    // Prevent exact duplicates
    const isDuplicate = citations.some(
      (c) => c.url.trim().toLowerCase() === normalizedUrl.trim().toLowerCase()
    );
    if (isDuplicate) {
      setUrlError(
        isEs
          ? 'Esta URL ya está en la lista de citas agregadas.'
          : 'This URL has already been added to the list.'
      );
      return;
    }

    // Create unique ID and placeholder citation item immediately
    const newItemId = `cit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const today = new Date().toISOString().split('T')[0];

    // Initial fallback metadata derived from URL
    let initialSite = '';
    try {
      initialSite = new URL(normalizedUrl).hostname.replace(/^www\./, '');
    } catch {
      initialSite = 'Sitio Web';
    }

    const initialMetadata: CitationItem['metadata'] = {
      title: initialSite,
      authors: initialSite,
      year: new Date().getFullYear().toString(),
      publicationDate: '',
      siteName: initialSite,
      publisher: initialSite,
      journalName: '',
      volume: '',
      issue: '',
      pages: '',
      url: normalizedUrl,
      doi: '',
      institution: '',
      platform: '',
      accessDate: today
    };

    const { inText: initInText, full: initFull } = formatCitation(
      initialMetadata,
      'website',
      style,
      isEs
    );

    const placeholderItem: CitationItem = {
      id: newItemId,
      url: normalizedUrl,
      sourceType: 'website',
      isLoading: true,
      metadata: initialMetadata,
      inTextCitation: initInText,
      fullReference: initFull,
      isExpanded: false
    };

    // Add new citation to the accumulated list
    setCitations((prev) => [...prev, placeholderItem]);

    // Immediately clear URL input field and keep it available for the next URL
    setUrlInput('');
    setIsAdding(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Extract metadata in background
    try {
      const extracted = await extractCitationFromInput(normalizedUrl, lang);

      const finalMetadata: CitationItem['metadata'] = {
        title: extracted.title || initialMetadata.title,
        authors: extracted.authors || initialMetadata.authors,
        year: extracted.year || initialMetadata.year,
        publicationDate: extracted.publicationDate || '',
        siteName: extracted.siteName || initialMetadata.siteName,
        publisher: extracted.publisher || extracted.siteName || initialMetadata.publisher,
        journalName: extracted.journalName || '',
        volume: extracted.volume || '',
        issue: extracted.issue || '',
        pages: extracted.pages || '',
        url: extracted.url || normalizedUrl,
        doi: extracted.doi || '',
        institution: '',
        platform: '',
        accessDate: today
      };

      const finalSourceType = (extracted.sourceType as SourceType) || 'website';
      const { inText, full } = formatCitation(finalMetadata, finalSourceType, style, isEs);

      setCitations((prev) =>
        prev.map((item) =>
          item.id === newItemId
            ? {
                ...item,
                isLoading: false,
                sourceType: finalSourceType,
                metadata: finalMetadata,
                inTextCitation: inText,
                fullReference: full
              }
            : item
        )
      );
    } catch (err: any) {
      // Keep placeholder item but mark as ready with fallback values
      setCitations((prev) =>
        prev.map((item) =>
          item.id === newItemId
            ? {
                ...item,
                isLoading: false,
                error: isEs
                  ? 'Metadatos automáticos no disponibles; se generó con los datos del enlace.'
                  : 'Metadata could not be auto-extracted; generated with URL defaults.'
              }
            : item
        )
      );
    } finally {
      setIsAdding(false);
    }
  };

  // Delete an individual citation
  const handleDeleteCitation = (idToDelete: string) => {
    setCitations((prev) => prev.filter((item) => item.id !== idToDelete));
  };

  // Clear all citations
  const handleClearAll = () => {
    if (citations.length === 0) return;
    const confirmClear = window.confirm(
      isEs
        ? '¿Estás seguro de que deseas eliminar todas las citas de la lista?'
        : 'Are you sure you want to clear all citations?'
    );
    if (confirmClear) {
      setCitations([]);
      setUrlError(null);
    }
  };

  // Copy single citation
  const handleCopySingle = (item: CitationItem) => {
    const text = item.fullReference.replace(/\*/g, '');
    navigator.clipboard.writeText(text);
    setCopiedItemId(item.id);
    setTimeout(() => setCopiedItemId(null), 2000);
  };

  // Copy all citations formatted in order
  const handleCopyAll = () => {
    if (citations.length === 0) return;

    // Strict format specified by user:
    // Cita 1
    // [contenido/formato de cita correspondiente]
    //
    // Cita 2
    // [contenido/formato de cita correspondiente]
    const formattedBlocks = citations.map((item, index) => {
      const cleanRef = item.fullReference.replace(/\*/g, '');
      return `Cita ${index + 1}\n${cleanRef}`;
    });

    const fullText = formattedBlocks.join('\n\n');
    navigator.clipboard.writeText(fullText);

    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
    // Notice: citations are NOT cleared after copying! They remain visible.
  };

  // Save single citation to user profile
  const handleSaveToProfile = (item: CitationItem) => {
    saveCitation({
      style,
      sourceType: item.sourceType,
      inTextCitation: item.inTextCitation,
      fullReference: item.fullReference,
      title: item.metadata.title || 'Sin título',
      authors: item.metadata.authors || item.metadata.siteName || 'Autor',
      year: item.metadata.year || '2024'
    });
    setSavedItemId(item.id);
    setTimeout(() => setSavedItemId(null), 2500);
  };

  // Toggle item expanded state for manual editing
  const toggleExpandItem = (id: string) => {
    setCitations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isExpanded: !item.isExpanded } : item))
    );
  };

  // Update specific metadata field of an item
  const updateItemMetadata = (
    id: string,
    field: keyof CitationItem['metadata'],
    value: string
  ) => {
    setCitations((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updatedMeta = { ...item.metadata, [field]: value };
        const { inText, full } = formatCitation(updatedMeta, item.sourceType, style, isEs);
        return {
          ...item,
          metadata: updatedMeta,
          inTextCitation: inText,
          fullReference: full
        };
      })
    );
  };

  // Quick preset loader (adds sample URL directly to test)
  const handleAddPreset = (type: 'news' | 'academic' | 'wiki') => {
    let presetUrl = '';
    if (type === 'news') {
      presetUrl = 'https://elpais.com/ciencia/2024-04-12/el-nuevo-telescopio-espacial.html';
    } else if (type === 'academic') {
      presetUrl = 'https://doi.org/10.1016/j.artint.2023.04.012';
    } else {
      presetUrl = 'https://es.wikipedia.org/wiki/Inteligencia_artificial';
    }
    setUrlInput(presetUrl);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header Visual Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isEs ? 'Múltiples Citas Acumulativas' : 'Multi-Citation Accumulator'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isEs ? 'Generador de Citas y Referencias Bibliográficas' : 'Citation & Reference Generator'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {isEs
                ? 'Agrega todas las páginas web, artículos y fuentes que necesites en una sola lista. Las citas se acumulan automáticamente para que puedas copiarlas todas juntas o administrarlas individualmente.'
                : 'Add multiple web pages, articles, and sources to an accumulated list. Easily copy all citations together or manage them one by one.'}
            </p>
          </div>

          <div className="md:col-span-1">
            <ToolVisualIllustration slug="citation-generator" size="hero" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SELECTOR DE FORMATO DE CITACIÓN (ESTILO GLOBAL) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>{isEs ? 'Norma de Citación Activa' : 'Active Citation Style'}</span>
          </label>
          <span className="text-[11px] text-slate-400">
            {isEs
              ? 'Cambia el estilo en cualquier momento; todas las citas de la lista se adaptarán automáticamente.'
              : 'Switch styles anytime; all accumulated citations will adapt instantly.'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { id: 'apa', label: 'APA 7.ª ed.' },
            { id: 'mla', label: 'MLA 9.ª ed.' },
            { id: 'chicago', label: 'Chicago' },
            { id: 'harvard', label: 'Harvard' },
            { id: 'vancouver', label: 'Vancouver' },
            { id: 'ieee', label: 'IEEE' }
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStyle(st.id as CitationStyle)}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                style === st.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 scale-102 ring-2 ring-blue-500/20'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700/50'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CAMPO PARA INTRODUCIR URL Y BOTÓN "AGREGAR CITA" */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-blue-950/20 rounded-3xl p-6 sm:p-8 border-2 border-indigo-200 dark:border-indigo-900/50 shadow-md space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{isEs ? 'Introduce una URL para agregar a la lista' : 'Enter a URL to add to your list'}</span>
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isEs
              ? 'Pega el enlace y presiona "Agregar cita". El campo quedará listo inmediatamente para introducir otra página.'
              : 'Paste a link and click "Add citation". The field remains ready to enter the next URL.'}
          </p>
        </div>

        <form onSubmit={handleAddCitation} className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (urlError) setUrlError(null);
              }}
              placeholder={
                isEs
                  ? 'Ejemplo: https://ejemplo.com/pagina1 o DOI: 10.1016/...'
                  : 'e.g. https://example.com/page1 or DOI: 10.1016/...'
              }
              className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={!urlInput.trim()}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isEs ? 'Agregar cita' : 'Add citation'}</span>
          </button>
        </form>

        {/* Validation or Duplicate Alert */}
        {urlError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs font-medium flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{urlError}</span>
          </div>
        )}

        {/* Quick Example Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400">
            {isEs ? 'Probar ejemplos rápidos:' : 'Try quick examples:'}
          </span>
          <button
            type="button"
            onClick={() => handleAddPreset('news')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {isEs ? 'Periódico / Noticia' : 'Newspaper'}
          </button>
          <button
            type="button"
            onClick={() => handleAddPreset('academic')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {isEs ? 'Artículo Académico (DOI)' : 'Academic DOI'}
          </button>
          <button
            type="button"
            onClick={() => handleAddPreset('wiki')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Wikipedia
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* LISTA VISIBLE DE TODAS LAS CITAS AGREGADAS */}
      {/* ========================================================================= */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Header with Counter & Batch Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isEs ? 'Citas Acumuladas' : 'Accumulated Citations'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {citations.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEs
                ? 'Puedes seguir agregando todas las citas que desees. Después de copiar, todas permanecerán en pantalla.'
                : 'Keep adding as many citations as you need. After copying, they remain on screen.'}
            </p>
          </div>

          {/* Action Buttons: "Copiar todas las citas" & "Limpiar todas" */}
          {citations.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors flex items-center gap-1.5 cursor-pointer"
                title={isEs ? 'Borrar toda la lista' : 'Clear all citations'}
              >
                <Trash2 className="w-4 h-4" />
                <span>{isEs ? 'Limpiar todas' : 'Clear all'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyAll}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>
                  {copiedAll
                    ? (isEs ? '¡Todas las citas copiadas!' : 'All citations copied!')
                    : (isEs ? 'Copiar todas las citas' : 'Copy all citations')}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {citations.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Globe className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isEs ? 'Aún no has agregado ninguna cita' : 'No citations added yet'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isEs
                  ? 'Pega un enlace en el campo superior y presiona "Agregar cita". Podrás agregar 10, 20 o más páginas y copiarlas juntas.'
                  : 'Paste a link above and click "Add citation". You can add 10, 20, or more links and copy them all together.'}
              </p>
            </div>
          </div>
        ) : (
          /* List of Accumulated Citations */
          <div className="space-y-4">
            {citations.map((item, index) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 transition-all hover:border-slate-300 dark:hover:border-slate-600"
              >
                {/* Item Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-sm sm:max-w-md">
                      {item.metadata.title || item.url}
                    </span>
                    {item.isLoading && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 animate-pulse shrink-0">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>{isEs ? 'Extrayendo metadatos...' : 'Extracting...'}</span>
                      </span>
                    )}
                  </div>

                  {/* Individual Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {/* Copy Single Citation Button */}
                    <button
                      type="button"
                      onClick={() => handleCopySingle(item)}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-600 transition-colors flex items-center gap-1 cursor-pointer"
                      title={isEs ? 'Copiar esta cita' : 'Copy this citation'}
                    >
                      {copiedItemId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {isEs ? '¡Copiada!' : 'Copied!'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>{isEs ? 'Copiar' : 'Copy'}</span>
                        </>
                      )}
                    </button>

                    {/* Save to Profile */}
                    <button
                      type="button"
                      onClick={() => handleSaveToProfile(item)}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer"
                      title={isEs ? 'Guardar en mi perfil' : 'Save to profile'}
                    >
                      {savedItemId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>

                    {/* Toggle Edit Metadata */}
                    <button
                      type="button"
                      onClick={() => toggleExpandItem(item.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-600 transition-colors flex items-center gap-1 cursor-pointer"
                      title={isEs ? 'Editar datos de esta cita' : 'Edit citation details'}
                    >
                      <span>{isEs ? 'Editar' : 'Edit'}</span>
                      {item.isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Individual Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteCitation(item.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title={isEs ? 'Eliminar esta cita' : 'Delete citation'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Formatted Reference Box (Sangría Francesa) */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    {style.toUpperCase()} • {isEs ? 'Referencia Completa' : 'Full Reference'}
                  </span>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-serif text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed pl-8 -indent-6 select-all">
                    {item.fullReference.replace(/\*/g, '')}
                  </div>
                </div>

                {/* In-Text Citation preview */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-400">
                      {isEs ? 'Cita en texto:' : 'In-text citation:'}
                    </span>
                    <span className="font-serif font-bold text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 select-all">
                      {item.inTextCitation}
                    </span>
                  </div>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline max-w-xs truncate"
                  >
                    <span>{item.url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>

                {/* Collapsible Edit Form for this specific citation */}
                {item.isExpanded && (
                  <div className="p-4 mt-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isEs ? 'Editar Datos de esta Fuente:' : 'Edit Source Details:'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isEs ? 'Los cambios se actualizan en tiempo real' : 'Updates in real-time'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          {isEs ? 'Título' : 'Title'}
                        </label>
                        <input
                          type="text"
                          value={item.metadata.title}
                          onChange={(e) => updateItemMetadata(item.id, 'title', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          {isEs ? 'Año' : 'Year'}
                        </label>
                        <input
                          type="text"
                          value={item.metadata.year}
                          onChange={(e) => updateItemMetadata(item.id, 'year', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          {isEs ? 'Autor(es) (Apellido, Nombre)' : 'Author(s)'}
                        </label>
                        <input
                          type="text"
                          value={item.metadata.authors}
                          onChange={(e) => updateItemMetadata(item.id, 'authors', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          {isEs ? 'Sitio / Editorial' : 'Site / Publisher'}
                        </label>
                        <input
                          type="text"
                          value={item.metadata.siteName}
                          onChange={(e) => updateItemMetadata(item.id, 'siteName', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* GUÍA PRÁCTICA DE FORMATOS */}
      {/* ========================================================================= */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span>{isEs ? 'Guía Rápida de Normas Bibliográficas' : 'Quick Citation Style Guide'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-extrabold text-blue-600">APA 7.ª edición</span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              {isEs
                ? 'Estándar en ciencias sociales, psicología y educación. Cita autor-año en el texto con sangría francesa en las referencias.'
                : 'Standard in social sciences. Uses author-date format.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-extrabold text-indigo-600">MLA 9.ª edición</span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              {isEs
                ? 'Preferido en literatura, lingüística y humanidades. Utiliza formato autor-página en el cuerpo del texto.'
                : 'Preferred in literature and humanities. Uses author-page.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-extrabold text-purple-600">Vancouver & IEEE</span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              {isEs
                ? 'Estándares numéricos en medicina, biomedicina e ingeniería. Cita mediante corchetes o números secuenciales.'
                : 'Numbered systems standard in medicine and engineering.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
