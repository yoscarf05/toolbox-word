import React, { useState, useEffect } from 'react';
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
  Download, 
  Sparkles, 
  AlertCircle, 
  Info,
  ExternalLink,
  HelpCircle,
  FileText,
  ListOrdered,
  Search,
  RefreshCw,
  Bookmark,
  CheckCircle2,
  Globe,
  Share2
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

interface CitationGeneratorToolProps {
  lang: Language;
}

export const CitationGeneratorTool: React.FC<CitationGeneratorToolProps> = ({ lang }) => {
  const { saveCitation, addHistoryItem } = useAuth();
  const isEs = lang === 'es';

  // 1. Citation Style & Source Type ('website' is default as mandated by user)
  const [style, setStyle] = useState<CitationStyle>('apa');
  const [sourceType, setSourceType] = useState<SourceType>('website');

  // 2. URL Automatic Extraction Input
  const [urlInput, setUrlInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<{
    success?: boolean;
    message?: string;
    detectedFields?: string[];
  } | null>(null);

  // 3. Form Fields
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState('');
  const [publicationDate, setPublicationDate] = useState('');
  const [publisher, setPublisher] = useState('');
  const [siteName, setSiteName] = useState('');
  const [journalName, setJournalName] = useState('');
  const [volume, setVolume] = useState('');
  const [issue, setIssue] = useState('');
  const [pages, setPages] = useState('');
  const [url, setUrl] = useState('');
  const [doi, setDoi] = useState('');
  const [institution, setInstitution] = useState('');
  const [platform, setPlatform] = useState('');
  const [accessDate, setAccessDate] = useState(() => new Date().toISOString().split('T')[0]);

  // 4. Output Results
  const [currentInText, setCurrentInText] = useState('');
  const [currentFullRef, setCurrentFullRef] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [copiedInText, setCopiedInText] = useState(false);
  const [copiedFullRef, setCopiedFullRef] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Record tool history on mount
  useEffect(() => {
    addHistoryItem({
      type: 'tool',
      title: isEs ? 'Generador de Citas y Referencias' : 'Citation & Reference Generator',
      slug: 'citation-generator',
      meta: 'APA 7 / MLA 9 / Chicago / Vancouver'
    });
  }, []);

  // Automatic Metadata Extraction Handler
  const handleExtractMetadata = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) {
      setExtractionStatus({
        success: false,
        message: isEs ? 'Por favor pega un enlace URL o código DOI.' : 'Please paste a valid URL or DOI.'
      });
      return;
    }

    setIsExtracting(true);
    setExtractionStatus(null);
    setValidationErrors([]);

    try {
      const meta = await extractCitationFromInput(urlInput, lang);
      
      // Auto-populate form fields
      if (meta.title) setTitle(meta.title);
      if (meta.authors) setAuthors(meta.authors);
      if (meta.year) setYear(meta.year);
      if (meta.publicationDate) setPublicationDate(meta.publicationDate);
      if (meta.siteName) setSiteName(meta.siteName);
      if (meta.publisher) setPublisher(meta.publisher);
      if (meta.journalName) setJournalName(meta.journalName);
      if (meta.volume) setVolume(meta.volume);
      if (meta.issue) setIssue(meta.issue);
      if (meta.pages) setPages(meta.pages);
      if (meta.url) setUrl(meta.url);
      if (meta.doi) setDoi(meta.doi);
      if (meta.sourceType) setSourceType(meta.sourceType);

      const detected = [
        meta.title ? (isEs ? 'Título' : 'Title') : '',
        meta.authors ? (isEs ? 'Autor/es' : 'Authors') : '',
        meta.siteName || meta.publisher ? (isEs ? 'Sitio / Editorial' : 'Site / Publisher') : '',
        meta.year || meta.publicationDate ? (isEs ? 'Fecha' : 'Date') : '',
        meta.doi ? 'DOI' : ''
      ].filter(Boolean);

      setExtractionStatus({
        success: true,
        message: isEs 
          ? '¡Metadatos detectados con éxito! Los campos se completaron automáticamente. Puedes revisarlos y editarlos abajo.'
          : 'Metadata successfully extracted! The form fields have been populated. You can edit them below.',
        detectedFields: detected
      });

      // Auto-generate citation with detected fields
      setTimeout(() => {
        generateCitationWithValues({
          titleVal: meta.title || '',
          authorsVal: meta.authors || meta.siteName || 'Anónimo',
          yearVal: meta.year || new Date().getFullYear().toString(),
          publisherVal: meta.publisher || meta.siteName || '',
          siteNameVal: meta.siteName || '',
          journalVal: meta.journalName || '',
          volumeVal: meta.volume || '',
          issueVal: meta.issue || '',
          pagesVal: meta.pages || '',
          urlVal: meta.url || urlInput.trim(),
          doiVal: meta.doi || '',
          typeVal: meta.sourceType || 'website',
          styleVal: style
        });
      }, 50);

    } catch (err: any) {
      setExtractionStatus({
        success: false,
        message: err?.message || (isEs ? 'No se pudieron extraer metadatos automáticamente. Por favor completa los datos manualmente.' : 'Could not automatically extract metadata. Please fill the fields manually.')
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // Generate citation formatting
  const generateCitationWithValues = (params: {
    titleVal: string;
    authorsVal: string;
    yearVal: string;
    publisherVal: string;
    siteNameVal: string;
    journalVal: string;
    volumeVal: string;
    issueVal: string;
    pagesVal: string;
    urlVal: string;
    doiVal: string;
    typeVal: SourceType;
    styleVal: CitationStyle;
  }) => {
    const {
      titleVal,
      authorsVal,
      yearVal,
      publisherVal,
      siteNameVal,
      journalVal,
      volumeVal,
      issueVal,
      pagesVal,
      urlVal,
      doiVal,
      typeVal,
      styleVal
    } = params;

    const authorList = authorsVal.trim();
    const cleanYear = yearVal.trim() || (isEs ? 's.f.' : 'n.d.');
    const cleanTitle = titleVal.trim();
    const cleanPublisher = publisherVal.trim();
    const cleanSiteName = siteNameVal.trim() || cleanPublisher;
    const cleanJournal = journalVal.trim();
    const cleanVolume = volumeVal.trim();
    const cleanIssue = issueVal.trim();
    const cleanPages = pagesVal.trim();
    const cleanUrl = urlVal.trim();
    const cleanDoi = doiVal.trim();

    // Primary surname for in-text citations
    let firstAuthorSurname = 'Autor';
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

    switch (styleVal) {
      case 'apa': {
        // APA 7th Edition
        inText = `(${firstAuthorSurname}, ${cleanYear})`;
        if (typeVal === 'website') {
          full = `${authorList || cleanSiteName} (${cleanYear}). *${cleanTitle}*. ${cleanSiteName && cleanSiteName !== authorList ? `${cleanSiteName}. ` : ''}${cleanUrl ? `Recuperado de ${cleanUrl}` : ''}`;
        } else if (typeVal === 'book') {
          full = `${authorList} (${cleanYear}). *${cleanTitle}*${cleanPublisher ? `. ${cleanPublisher}` : ''}${cleanDoi ? `. https://doi.org/${cleanDoi}` : ''}.`;
        } else if (typeVal === 'journal') {
          const volIssue = cleanVolume ? `, *${cleanVolume}*${cleanIssue ? `(${cleanIssue})` : ''}` : '';
          const pgs = cleanPages ? `, ${cleanPages}` : '';
          full = `${authorList} (${cleanYear}). ${cleanTitle}. *${cleanJournal}*${volIssue}${pgs}.${cleanDoi ? ` https://doi.org/${cleanDoi}` : cleanUrl ? ` ${cleanUrl}` : ''}`;
        } else if (typeVal === 'newspaper') {
          full = `${authorList || cleanSiteName} (${publicationDate || cleanYear}). ${cleanTitle}. *${cleanSiteName || 'Periódico'}*.${cleanUrl ? ` ${cleanUrl}` : ''}`;
        } else if (typeVal === 'thesis') {
          full = `${authorList} (${cleanYear}). *${cleanTitle}* [Tesis, ${institution || 'Universidad'}]. Repositorio institucional.${cleanUrl ? ` ${cleanUrl}` : ''}`;
        } else if (typeVal === 'video') {
          full = `${authorList || 'Canal'} (${cleanYear}). *${cleanTitle}* [Video]. ${platform || 'YouTube'}.${cleanUrl ? ` ${cleanUrl}` : ''}`;
        } else if (typeVal === 'organization') {
          full = `${authorList || cleanSiteName} (${cleanYear}). *${cleanTitle}*. ${cleanSiteName}.${cleanUrl ? ` ${cleanUrl}` : ''}`;
        } else {
          full = `${authorList} (${cleanYear}). *${cleanTitle}*. ${cleanPublisher ? `${cleanPublisher}. ` : ''}${cleanDoi ? `https://doi.org/${cleanDoi}` : cleanUrl || ''}`;
        }
        break;
      }

      case 'mla': {
        // MLA 9th Edition
        inText = `(${firstAuthorSurname} ${cleanPages ? cleanPages.split('-')[0].trim() : cleanYear})`;
        if (typeVal === 'website') {
          full = `${authorList || cleanSiteName}. "${cleanTitle}." *${cleanSiteName || 'Sitio Web'}*, ${cleanYear}, ${cleanUrl || ''}.`;
        } else if (typeVal === 'book') {
          full = `${authorList}. *${cleanTitle}*. ${cleanPublisher || 'Editorial'}, ${cleanYear}.`;
        } else if (typeVal === 'journal') {
          const vol = cleanVolume ? `, vol. ${cleanVolume}` : '';
          const iss = cleanIssue ? `, no. ${cleanIssue}` : '';
          const pgs = cleanPages ? `, pp. ${cleanPages}` : '';
          full = `${authorList}. "${cleanTitle}." *${cleanJournal}*${vol}${iss}, ${cleanYear}${pgs}.${cleanDoi ? ` https://doi.org/${cleanDoi}` : cleanUrl ? ` ${cleanUrl}` : ''}`;
        } else if (typeVal === 'newspaper') {
          full = `${authorList || cleanSiteName}. "${cleanTitle}." *${cleanSiteName}*, ${publicationDate || cleanYear}, ${cleanUrl || ''}.`;
        } else {
          full = `${authorList}. *${cleanTitle}*. ${cleanPublisher ? `${cleanPublisher}, ` : ''}${cleanYear}.`;
        }
        break;
      }

      case 'chicago': {
        // Chicago Author-Date 17th
        inText = `(${firstAuthorSurname} ${cleanYear})`;
        if (typeVal === 'website') {
          full = `${authorList || cleanSiteName}. ${cleanYear}. "${cleanTitle}." ${cleanSiteName}. Accedido el ${accessDate}. ${cleanUrl || ''}.`;
        } else if (typeVal === 'book') {
          full = `${authorList}. ${cleanYear}. *${cleanTitle}*${cleanPublisher ? `. ${cleanPublisher}` : ''}.`;
        } else if (typeVal === 'journal') {
          const volIssue = cleanVolume ? ` ${cleanVolume}${cleanIssue ? `, no. ${cleanIssue}` : ''}` : '';
          const pgs = cleanPages ? `: ${cleanPages}` : '';
          full = `${authorList}. ${cleanYear}. "${cleanTitle}." *${cleanJournal}*${volIssue}${pgs}.${cleanDoi ? ` https://doi.org/${cleanDoi}` : ''}`;
        } else {
          full = `${authorList}. ${cleanYear}. "${cleanTitle}." ${cleanPublisher ? `${cleanPublisher}. ` : ''}${cleanUrl || ''}`;
        }
        break;
      }

      case 'harvard': {
        // Harvard Style
        inText = `(${firstAuthorSurname}, ${cleanYear})`;
        if (typeVal === 'website') {
          full = `${authorList || cleanSiteName} (${cleanYear}) *${cleanTitle}*. Disponible en: ${cleanUrl || 'Online'} (Accedido: ${accessDate}).`;
        } else if (typeVal === 'journal') {
          full = `${authorList} (${cleanYear}) '${cleanTitle}', *${cleanJournal}*, ${cleanVolume || ''}${cleanIssue ? `(${cleanIssue})` : ''}, pp. ${cleanPages || ''}.`;
        } else {
          full = `${authorList} (${cleanYear}) *${cleanTitle}*. ${cleanPublisher ? `${cleanPublisher}.` : ''}`;
        }
        break;
      }

      case 'vancouver': {
        // Vancouver
        inText = `(1)`;
        if (typeVal === 'website') {
          full = `${authorList || cleanSiteName}. ${cleanTitle} [Internet]. ${cleanSiteName}; ${cleanYear} [citado el ${accessDate}]. Disponible en: ${cleanUrl || ''}`;
        } else if (typeVal === 'journal') {
          full = `${authorList}. ${cleanTitle}. ${cleanJournal}. ${cleanYear};${cleanVolume || ''}${cleanIssue ? `(${cleanIssue})` : ''}:${cleanPages || ''}.`;
        } else {
          full = `${authorList}. ${cleanTitle}. ${cleanPublisher ? `${cleanPublisher}; ` : ''}${cleanYear}.`;
        }
        break;
      }

      case 'ieee': {
        // IEEE
        inText = `[1]`;
        if (typeVal === 'website') {
          full = `${authorList || cleanSiteName}, "${cleanTitle}," ${cleanSiteName}, ${cleanYear}. [En línea]. Disponible: ${cleanUrl || ''}. [Accedido: ${accessDate}].`;
        } else if (typeVal === 'journal') {
          full = `${authorList}, "${cleanTitle}," *${cleanJournal}*, vol. ${cleanVolume || '1'}, no. ${cleanIssue || '1'}, pp. ${cleanPages || '1'}, ${cleanYear}.`;
        } else {
          full = `${authorList}, *${cleanTitle}*. ${cleanPublisher || 'Editorial'}, ${cleanYear}.`;
        }
        break;
      }
    }

    setCurrentInText(inText);
    setCurrentFullRef(full);
  };

  const handleGenerateClick = () => {
    const errors: string[] = [];
    if (!title.trim()) {
      errors.push(isEs ? 'El título es obligatorio.' : 'Title is required.');
    }
    if (!authors.trim() && !siteName.trim()) {
      errors.push(isEs ? 'El autor o nombre del sitio / organización es obligatorio.' : 'Author or site name is required.');
    }
    if (!year.trim()) {
      errors.push(isEs ? 'El año o fecha de publicación es obligatorio.' : 'Year of publication is required.');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);

    generateCitationWithValues({
      titleVal: title,
      authorsVal: authors,
      yearVal: year,
      publisherVal: publisher,
      siteNameVal: siteName,
      journalVal: journalName,
      volumeVal: volume,
      issueVal: issue,
      pagesVal: pages,
      urlVal: url,
      doiVal: doi,
      typeVal: sourceType,
      styleVal: style
    });
  };

  const handleCopy = (text: string, type: 'inText' | 'full' | 'all') => {
    navigator.clipboard.writeText(text.replace(/\*/g, ''));
    if (type === 'inText') {
      setCopiedInText(true);
      setTimeout(() => setCopiedInText(false), 2000);
    } else if (type === 'full') {
      setCopiedFullRef(true);
      setTimeout(() => setCopiedFullRef(false), 2000);
    } else {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const handleSaveToProfile = () => {
    if (!currentFullRef) return;
    saveCitation({
      style,
      sourceType,
      inTextCitation: currentInText,
      fullReference: currentFullRef,
      title: title || 'Sin título',
      authors: authors || siteName || 'Autor',
      year: year || '2024'
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetForm = () => {
    setUrlInput('');
    setExtractionStatus(null);
    setTitle('');
    setAuthors('');
    setYear('');
    setPublicationDate('');
    setPublisher('');
    setSiteName('');
    setJournalName('');
    setVolume('');
    setIssue('');
    setPages('');
    setUrl('');
    setDoi('');
    setInstitution('');
    setPlatform('');
    setCurrentInText('');
    setCurrentFullRef('');
    setValidationErrors([]);
  };

  // Quick preset examples for user testing
  const loadPresetExample = (type: 'news' | 'academic' | 'book') => {
    if (type === 'news') {
      setUrlInput('https://elpais.com/ciencia/2024-04-12/el-nuevo-telescopio-espacial.html');
      setSourceType('newspaper');
      setTitle('El nuevo telescopio espacial revela los secretos de las galaxias tempranas');
      setAuthors('Sánchez, Nuño');
      setYear('2024');
      setPublicationDate('12 de abril de 2024');
      setSiteName('El País');
      setPublisher('Ediciones El País');
      setUrl('https://elpais.com/ciencia/2024-04-12/el-nuevo-telescopio-espacial.html');
      setDoi('');
    } else if (type === 'academic') {
      setUrlInput('10.1016/j.artint.2023.04.012');
      setSourceType('journal');
      setTitle('Neural network applications in cognitive document processing');
      setAuthors('Smith, John; Watson, Clara');
      setYear('2023');
      setJournalName('Journal of Artificial Intelligence Research');
      setVolume('45');
      setIssue('3');
      setPages('112-128');
      setUrl('https://doi.org/10.1016/j.artint.2023.04.012');
      setDoi('10.1016/j.artint.2023.04.012');
      setSiteName('Elsevier');
    } else {
      setUrlInput('');
      setSourceType('book');
      setTitle('Cien años de soledad');
      setAuthors('García Márquez, Gabriel');
      setYear('1967');
      setPublisher('Editorial Sudamericana');
      setSiteName('');
      setUrl('');
      setDoi('');
    }
  };

  // All 10 mandatory source types
  const SOURCE_TYPE_LABELS: { id: SourceType; label: { es: string; en: string }; icon: string }[] = [
    { id: 'website', label: { es: 'Sitio Web', en: 'Website' }, icon: 'Globe' },
    { id: 'book', label: { es: 'Libro', en: 'Book' }, icon: 'Book' },
    { id: 'journal', label: { es: 'Artículo Científico', en: 'Journal Article' }, icon: 'FileText' },
    { id: 'magazine', label: { es: 'Revista', en: 'Magazine' }, icon: 'Bookmark' },
    { id: 'newspaper', label: { es: 'Periódico', en: 'Newspaper' }, icon: 'FileText' },
    { id: 'thesis', label: { es: 'Tesis Universitaria', en: 'Thesis / Dissertation' }, icon: 'GraduationCap' },
    { id: 'pdf', label: { es: 'Documento PDF', en: 'PDF Document' }, icon: 'File' },
    { id: 'video', label: { es: 'Video / YouTube', en: 'Video' }, icon: 'Video' },
    { id: 'organization', label: { es: 'Página de Organización', en: 'Organization Page' }, icon: 'Building' },
    { id: 'social', label: { es: 'Redes Sociales', en: 'Social Media' }, icon: 'Share2' },
    { id: 'other', label: { es: 'Otro Formato', en: 'Other' }, icon: 'Sparkles' }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header Visual Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isEs ? 'Automatización Inteligente' : 'Smart Automation'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isEs ? 'Generador de Citas y Referencias Bibliográficas' : 'Citation & Reference Generator'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {isEs
                ? 'Genera citas automáticas en formato APA 7.ª edición, MLA 9, Chicago, Harvard, Vancouver e IEEE. Pega el enlace de la fuente para extraer automáticamente autor, título, editorial y fecha.'
                : 'Instantly generate citations in APA 7th, MLA 9, Chicago, Harvard, Vancouver, and IEEE. Paste a URL or DOI to auto-extract author, title, site, and date.'}
            </p>
          </div>

          <div className="md:col-span-1">
            <ToolVisualIllustration slug="citation-generator" size="hero" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SECCIÓN PRINCIPAL: EXTRACCIÓN AUTOMÁTICA POR URL / DOI */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-blue-950/20 rounded-3xl p-6 sm:p-8 border-2 border-indigo-200 dark:border-indigo-900/50 shadow-md space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{isEs ? 'Pega aquí el enlace de la fuente que quieres citar' : 'Paste the source link you want to cite here'}</span>
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isEs
              ? 'Admite enlaces de páginas web, periódicos, artículos científicos, Wikipedia, revistas o identificadores DOI.'
              : 'Supports URLs from websites, news, scholarly articles, Wikipedia, journals, or DOI numbers.'}
          </p>
        </div>

        {/* Input and Action Button */}
        <form onSubmit={handleExtractMetadata} className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={isEs ? 'Ejemplo: https://www.ejemplo.com/articulo o DOI: 10.1016/...' : 'e.g. https://www.example.com/article or DOI: 10.1016/...'}
              className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isExtracting || !urlInput.trim()}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isExtracting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{isEs ? 'Obteniendo datos...' : 'Extracting data...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{isEs ? 'Obtener información' : 'Extract Info'}</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Example Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400">
            {isEs ? 'Probar ejemplo rápido:' : 'Try quick example:'}
          </span>
          <button
            type="button"
            onClick={() => loadPresetExample('news')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {isEs ? 'Noticia / Periódico' : 'Newspaper'}
          </button>
          <button
            type="button"
            onClick={() => loadPresetExample('academic')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {isEs ? 'Artículo Científico (DOI)' : 'Scientific DOI'}
          </button>
          <button
            type="button"
            onClick={() => loadPresetExample('book')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {isEs ? 'Libro' : 'Book'}
          </button>
        </div>

        {/* Feedback Alert for Extraction */}
        {extractionStatus && (
          <div
            className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 animate-fade-in ${
              extractionStatus.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {extractionStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              )}
              <span>{extractionStatus.message}</span>
            </div>

            {extractionStatus.detectedFields && extractionStatus.detectedFields.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="font-semibold text-emerald-900 dark:text-emerald-300">
                  {isEs ? 'Datos identificados:' : 'Identified data:'}
                </span>
                {extractionStatus.detectedFields.map((f, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-medium text-[11px]"
                  >
                    ✓ {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 2. SELECTORES DE ESTILO Y TIPO DE FUENTE */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Style Selector */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {isEs ? '1. Formato de Citación' : '1. Citation Format Style'}
          </label>
          <div className="grid grid-cols-3 gap-2">
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
                onClick={() => {
                  setStyle(st.id as CitationStyle);
                  if (title) {
                    generateCitationWithValues({
                      titleVal: title,
                      authorsVal: authors,
                      yearVal: year,
                      publisherVal: publisher,
                      siteNameVal: siteName,
                      journalVal: journalName,
                      volumeVal: volume,
                      issueVal: issue,
                      pagesVal: pages,
                      urlVal: url,
                      doiVal: doi,
                      typeVal: sourceType,
                      styleVal: st.id as CitationStyle
                    });
                  }
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                  style === st.id
                    ? 'bg-blue-600 text-white shadow-xs scale-102'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Source Type Selector (Default is 'website') */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {isEs ? '2. Tipo de Fuente (Sitio Web por defecto)' : '2. Source Type (Website by default)'}
          </label>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as SourceType)}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            {SOURCE_TYPE_LABELS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label[lang] || item.label.es}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isEs
              ? 'Los campos del formulario se adaptan automáticamente al tipo de fuente seleccionado.'
              : 'Form fields adapt dynamically to the selected source type.'}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FORMULARIO DINÁMICO DE DATOS EDITABLES */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>{isEs ? 'Datos de la Fuente (Revisar y Editar)' : 'Source Information (Review & Edit)'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEs
                ? 'Puedes corregir cualquier campo o agregar información complementaria si es necesario.'
                : 'Modify any field or complete missing values before generating your final citation.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetForm}
            className="text-xs text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
          >
            {isEs ? 'Limpiar formulario' : 'Clear form'}
          </button>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs space-y-1">
            {validationErrors.map((err, i) => (
              <p key={i} className="flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{err}</span>
              </p>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Title (Always visible) */}
          <div className="sm:col-span-2 md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {sourceType === 'book'
                ? (isEs ? 'Título del Libro *' : 'Book Title *')
                : sourceType === 'journal'
                ? (isEs ? 'Título del Artículo Científico *' : 'Article Title *')
                : (isEs ? 'Título de la Página o Artículo *' : 'Page or Article Title *')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isEs ? 'Ej: Fundamentos de Inteligencia Artificial' : 'e.g. Artificial Intelligence Fundamentals'}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Authors (Always visible) */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isEs ? 'Autor(es) o Entidad Emisora' : 'Author(s) or Entity'}
            </label>
            <input
              type="text"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              placeholder={isEs ? 'Ej: García Márquez, Gabriel o Varios Autores' : 'e.g. Smith, John or World Health Organization'}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              {isEs ? 'Formato sugerido: Apellido, Nombre. Separa varios autores con punto y coma (;)' : 'Format: Surname, Given Name. Separate multiple authors with semicolons (;)'}
            </span>
          </div>

          {/* Year */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isEs ? 'Año de Publicación *' : 'Publication Year *'}
            </label>
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2024"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Website / Site Name */}
          {(sourceType === 'website' || sourceType === 'newspaper' || sourceType === 'organization') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {sourceType === 'newspaper'
                  ? (isEs ? 'Nombre del Periódico' : 'Newspaper Name')
                  : (isEs ? 'Nombre del Sitio Web' : 'Website Name')}
              </label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder={isEs ? 'Ej: El País, BBC News o Wikipedia' : 'e.g. BBC News or Wikipedia'}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* Publisher */}
          {(sourceType === 'book' || sourceType === 'thesis' || sourceType === 'other') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEs ? 'Editorial o Institución' : 'Publisher / Institution'}
              </label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder={isEs ? 'Ej: McGraw-Hill o Universidad de Oxford' : 'e.g. Oxford University Press'}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* Journal Specific Fields */}
          {sourceType === 'journal' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEs ? 'Nombre de la Revista Académica' : 'Academic Journal Name'}
                </label>
                <input
                  type="text"
                  value={journalName}
                  onChange={(e) => setJournalName(e.target.value)}
                  placeholder="Nature o Journal of Science"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEs ? 'Volumen y Número' : 'Volume & Issue'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    placeholder="Vol. 45"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    placeholder="N.º 3"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEs ? 'Páginas' : 'Pages'}
                </label>
                <input
                  type="text"
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  placeholder="112-128"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* URL */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* DOI */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              DOI (Identificador Digital de Objeto)
            </label>
            <input
              type="text"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              placeholder="10.1016/..."
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleGenerateClick}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isEs ? 'Generar Cita y Referencia' : 'Generate Citation & Reference'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. RESULTADOS DE CITACIÓN (CITA EN TEXTO Y REFERENCIA COMPLETA) */}
      {/* ========================================================================= */}
      {currentFullRef && (
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-blue-500 dark:border-blue-500 shadow-xl space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {style.toUpperCase()} • {sourceType}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEs ? 'Cita Generada' : 'Citation Generated'}</span>
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {isEs ? 'Resultados Listos para Copiar' : 'Ready to Copy'}
              </h2>
            </div>

            {/* Save & Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveToProfile}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-600">{isEs ? '¡Guardada!' : 'Saved!'}</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4 text-indigo-500" />
                    <span>{isEs ? 'Guardar en mi lista' : 'Save citation'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleCopy(`${currentFullRef.replace(/\*/g, '')}\nCita en texto: ${currentInText}`, 'all')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedAll ? (isEs ? '¡Copiado todo!' : 'Copied!') : (isEs ? 'Copiar todo' : 'Copy all')}</span>
              </button>
            </div>
          </div>

          {/* Reference Card (Sangría Francesa) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isEs ? 'Referencia Bibliográfica Completa:' : 'Full Bibliographic Reference:'}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(currentFullRef, 'full')}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {copiedFullRef ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFullRef ? (isEs ? '¡Copiada!' : 'Copied!') : (isEs ? 'Copiar referencia' : 'Copy reference')}</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 font-serif text-sm text-slate-900 dark:text-slate-100 leading-relaxed pl-8 -indent-6 select-all">
              {currentFullRef.replace(/\*/g, '')}
            </div>
          </div>

          {/* In-text Citation Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isEs ? 'Cita Dentro del Texto (Paréntesis):' : 'In-Text Citation:'}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(currentInText, 'inText')}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {copiedInText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedInText ? (isEs ? '¡Copiada!' : 'Copied!') : (isEs ? 'Copiar cita' : 'Copy citation')}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 font-serif text-sm font-semibold text-slate-900 dark:text-slate-100 select-all">
              {currentInText}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. GUÍA PRÁCTICA DE FORMATOS */}
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
              {isEs ? 'Estándar en ciencias sociales, psicología y educación. Utiliza autor-año en el texto con sangría francesa en referencias.' : 'Standard in social sciences and education. Uses author-date.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-extrabold text-indigo-600">MLA 9.ª edición</span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              {isEs ? 'Preferido en literatura, lingüística y humanidades. Utiliza formato autor-página en el cuerpo del texto.' : 'Preferred in humanities and literature. Uses author-page.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-extrabold text-purple-600">Vancouver & IEEE</span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              {isEs ? 'Estándares numéricos en medicina, biomedicina e ingeniería. Cita mediante corchetes o números secuenciales.' : 'Numbered systems standard in medicine, tech, and engineering.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
