import React, { useState, useMemo } from 'react';
import { Language, Category, Tool } from '../types';
import { CATEGORIES } from '../data/categories';
import { TOOLS } from '../data/tools';
import { GUIDES } from '../data/guides';
import { InContentAd, LateralAdLayout } from './AdComponents';
import { DynamicIcon } from './DynamicIcon';
import { ToolVisualIllustration } from './ToolVisualIllustration';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  ChevronRight, 
  Star, 
  Lock,
  FileType,
  Quote,
  CheckCircle2,
  FileText,
  Clock,
  Layers,
  HelpCircle,
  FolderOpen,
  Smartphone,
  Cpu,
  EyeOff,
  UserCheck,
  ExternalLink,
  Globe
} from 'lucide-react';

interface HomePageProps {
  lang: Language;
  onNavigate: (route: string) => void;
  onOpenSearch: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ lang, onNavigate, onOpenSearch }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const { 
    user, 
    getGreeting, 
    isFavoriteTool, 
    toggleFavoriteTool, 
    setIsAuthModalOpen,
    setIsProfileModalOpen 
  } = useAuth();

  const isEs = lang === 'es';
  const { greeting, subtext } = getGreeting(lang);

  // Top priority flagship tools
  const pdfToWordTool = TOOLS.find((t) => t.slug === 'pdf-to-word') || TOOLS[0];
  const citationGeneratorTool = TOOLS.find((t) => t.slug === 'citation-generator') || TOOLS[1];

  // Other popular tools (min 6-8) excluding the two top priority heroes
  const otherPopularTools = useMemo(() => {
    return TOOLS.filter(
      (t) => t.slug !== 'pdf-to-word' && t.slug !== 'citation-generator'
    ).slice(0, 8);
  }, []);

  // Filtered tools catalog
  const catalogTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        tool.categoryId === selectedCategory ||
        tool.category === selectedCategory;

      const name = (tool.name[lang] || tool.name.es || '').toLowerCase();
      const desc = (tool.shortDescription[lang] || tool.shortDescription.es || '').toLowerCase();
      const query = searchFilter.toLowerCase().trim();
      const matchesSearch = !query || name.includes(query) || desc.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchFilter, lang]);

  // Featured guides (natural selection, no quota text)
  const featuredGuides = useMemo(() => {
    return GUIDES.slice(0, 6);
  }, []);

  return (
    <LateralAdLayout>
      <div className="space-y-16 sm:space-y-20 py-6 sm:py-10">
        
        {/* ========================================================================= */}
        {/* 1. HERO PRINCIPAL CON SALUDO PERSONALIZADO SEGÚN HORA */}
        {/* ========================================================================= */}
        <section className="max-w-5xl mx-auto px-4 text-center space-y-6 pt-2 sm:pt-4">
          
          {/* Greeting Box */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-xs font-medium text-slate-700 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-900 dark:text-white">
              {greeting}
            </span>
            {user ? (
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="ml-1 text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
              >
                {isEs ? 'Ver mi perfil' : 'View profile'}
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="ml-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-medium transition-colors cursor-pointer"
              >
                ({isEs ? 'Iniciar sesión opcional' : 'Optional sign in'})
              </button>
            )}
          </div>

          {/* Privacy Pill */}
          <div className="block">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                {isEs 
                  ? 'Procesamiento 100% Local en tu Navegador • Máxima Privacidad' 
                  : '100% Client-Side Processing • Total Privacy'}
              </span>
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            {isEs ? (
              <>
                La plataforma moderna de <span className="text-blue-600 dark:text-blue-400">herramientas digitales</span>
              </>
            ) : (
              <>
                The modern suite for <span className="text-blue-600 dark:text-blue-400">digital tools</span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {subtext}
          </p>

          {/* Quick Search Bar trigger */}
          <div className="max-w-2xl mx-auto pt-2">
            <button
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all text-sm group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  {isEs 
                    ? 'Buscar herramienta (ej. PDF a Word, Citas APA 7, comprimir, unir, QR...)' 
                    : 'Search tool (e.g. PDF to Word, APA 7 citations, compress, merge, QR...)'}
                </span>
              </div>
              <kbd className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-500 border border-slate-200 dark:border-slate-700">
                Ctrl + K
              </kbd>
            </button>
          </div>

          {/* Quick Direct Links to Top Used Tools */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="text-slate-400 mr-1 text-[11px] uppercase tracking-wider font-bold">
              {isEs ? 'Acceso rápido:' : 'Quick access:'}
            </span>
            <button
              onClick={() => onNavigate('/tool/pdf-to-word')}
              className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/60 dark:border-blue-800/60 transition-colors cursor-pointer"
            >
              PDF a Word (.docx)
            </button>
            <button
              onClick={() => onNavigate('/tool/citation-generator')}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/60 transition-colors cursor-pointer"
            >
              Generador de Citas APA / MLA
            </button>
            <button
              onClick={() => onNavigate('/tool/compress-pdf')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Comprimir PDF
            </button>
            <button
              onClick={() => onNavigate('/tool/merge-pdf')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Unir PDF
            </button>
            <button
              onClick={() => onNavigate('/tool/compress-image')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Comprimir Imagen
            </button>
            <button
              onClick={() => onNavigate('/tool/qr-generator')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Código QR
            </button>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. HERRAMIENTA DESTACADA 1: PDF A WORD (CON ILUSTRACIÓN Y FORMATOS) */}
        {/* ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              
              {/* Text Info */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-bold tracking-wider uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isEs ? 'Herramienta Principal #1' : 'Featured Flagship Tool #1'}</span>
                  </div>
                  <button
                    onClick={() => toggleFavoriteTool('pdf-to-word')}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-white"
                    title={isEs ? 'Guardar en favoritos' : 'Add to favorites'}
                  >
                    <Star className={`w-4 h-4 ${isFavoriteTool('pdf-to-word') ? 'fill-amber-300 text-amber-300' : ''}`} />
                  </button>
                </div>

                <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                  {isEs ? 'Convertir PDF a Word Editable (.docx)' : 'Convert PDF to Editable Word (.docx)'}
                </h2>

                <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
                  {isEs
                    ? 'Transforma archivos PDF a documentos Microsoft Word con texto, títulos y párrafos 100% editables. Procesamiento rápido ejecutado en tu navegador: tus contratos, tesis y estados de cuenta nunca se envían a ningún servidor.'
                    : 'Convert any PDF file into editable Microsoft Word (.docx) documents preserving structure and paragraphs. Processed natively in your browser for absolute confidentiality.'}
                </p>

                {/* Formatos compatibles claramente visibles */}
                <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-blue-200">
                  <span className="text-white font-bold uppercase text-[11px]">
                    {isEs ? 'Formatos compatibles:' : 'Compatible formats:'}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/15 text-white font-mono text-xs">.pdf de entrada</span>
                  <span>→</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/20 text-white font-mono text-xs font-bold">.docx editable</span>
                  <span className="text-blue-100/90 text-xs">
                    (Compatible con Word 2010–2024, Microsoft 365, Google Docs, LibreOffice)
                  </span>
                </div>

                {/* CTA Action */}
                <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => onNavigate('/tool/pdf-to-word')}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.02]"
                  >
                    <FileType className="w-5 h-5 text-blue-600" />
                    <span>{isEs ? 'Abrir PDF a Word Gratis' : 'Open PDF to Word Free'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-blue-200 font-medium">
                    {isEs ? '✓ Sin límites de páginas • Sin marcas de agua' : '✓ No page limits • No watermarks'}
                  </span>
                </div>
              </div>

              {/* Visual Illustration */}
              <div className="lg:col-span-4 flex justify-center">
                <div className="w-full max-w-[280px]">
                  <ToolVisualIllustration slug="pdf-to-word" size="card" />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. HERRAMIENTA DESTACADA 2: GENERADOR DE CITAS Y REFERENCIAS */}
        {/* ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-500/30 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              
              {/* Text Info */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-bold tracking-wider uppercase">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isEs ? 'Herramienta Principal #2 • Académico' : 'Featured Flagship Tool #2 • Academic'}</span>
                  </div>
                  <button
                    onClick={() => toggleFavoriteTool('citation-generator')}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-white"
                    title={isEs ? 'Guardar en favoritos' : 'Add to favorites'}
                  >
                    <Star className={`w-4 h-4 ${isFavoriteTool('citation-generator') ? 'fill-amber-300 text-amber-300' : ''}`} />
                  </button>
                </div>

                <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                  {isEs ? 'Generador de Citas y Referencias Bibliográficas' : 'Citation & Reference Generator'}
                </h2>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {isEs
                    ? 'Automatización inteligente: pega el enlace o código DOI y extrae automáticamente título, autores, fecha y sitio web sin tener que reescribir todo a mano. Compatible con APA 7, MLA 9, Chicago, Harvard, Vancouver e IEEE.'
                    : 'Smart automation: paste the URL or DOI to auto-extract title, authors, publication date, and publisher. Generate APA 7, MLA 9, Chicago, Harvard, Vancouver, and IEEE in seconds.'}
                </p>

                {/* Estilos soportados visibles */}
                <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-300">
                  <span className="text-indigo-300 font-bold uppercase text-[11px]">
                    {isEs ? 'Estilos oficiales:' : 'Official styles:'}
                  </span>
                  {['APA 7.ª ed.', 'MLA 9.ª ed.', 'Chicago', 'Harvard', 'Vancouver', 'IEEE'].map((st) => (
                    <span key={st} className="px-2.5 py-1 rounded-lg bg-white/10 text-white text-[11px] font-medium border border-white/10">
                      {st}
                    </span>
                  ))}
                </div>

                {/* CTA Action */}
                <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => onNavigate('/tool/citation-generator')}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.02]"
                  >
                    <Quote className="w-5 h-5 text-white" />
                    <span>{isEs ? 'Generar Citas Automáticas' : 'Generate Citations Free'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-indigo-300 font-medium">
                    {isEs ? '✓ Extracción automática de enlaces • Copia en 1 clic' : '✓ Auto URL extraction • 1-click copy'}
                  </span>
                </div>
              </div>

              {/* Visual Illustration */}
              <div className="lg:col-span-4 flex justify-center">
                <div className="w-full max-w-[280px]">
                  <ToolVisualIllustration slug="citation-generator" size="card" />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Non-intrusive AdSlot between flagships and popular tools */}
        <InContentAd />

        {/* ========================================================================= */}
        {/* 4. OTRAS HERRAMIENTAS DESTACADAS / POPULARES (Mínimo 6-8) */}
        {/* ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {isEs ? 'Otras Herramientas Populares' : 'Other Popular Tools'}
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {otherPopularTools.length} {isEs ? 'herramientas destacadas' : 'featured tools'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {otherPopularTools.map((tool) => (
              <div
                key={tool.id}
                className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Tool Card Header with Favorite Button */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {tool.categoryId}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteTool(tool.slug);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                      title={isEs ? 'Favorito' : 'Favorite'}
                    >
                      <Star className={`w-4 h-4 ${isFavoriteTool(tool.slug) ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </div>

                  {/* Dedicated Visual Illustration for EVERY tool */}
                  <div
                    onClick={() => onNavigate(`/tool/${tool.slug}`)}
                    className="cursor-pointer"
                  >
                    <ToolVisualIllustration slug={tool.slug} size="card" />
                  </div>

                  {/* Title & Description */}
                  <div
                    onClick={() => onNavigate(`/tool/${tool.slug}`)}
                    className="cursor-pointer space-y-1"
                  >
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {tool.name[lang] || tool.name.es}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {tool.shortDescription[lang] || tool.shortDescription.es}
                    </p>
                  </div>
                </div>

                <div 
                  onClick={() => onNavigate(`/tool/${tool.slug}`)}
                  className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 cursor-pointer"
                >
                  <span>{isEs ? 'Abrir herramienta' : 'Open tool'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. TODAS LAS HERRAMIENTAS ORGANIZADAS */}
        {/* ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {isEs ? 'Catálogo Completo de Herramientas' : 'All Organized Tools'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {catalogTools.length} {isEs ? 'herramientas disponibles' : 'tools ready to use'}
              </p>
            </div>

            {/* Search within catalog */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder={isEs ? 'Filtrar herramientas...' : 'Filter tools...'}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {isEs ? 'Todas' : 'All'} ({TOOLS.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = TOOLS.filter((t) => t.categoryId === cat.id || t.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.name[lang] || cat.name.es} ({count})
                </button>
              );
            })}
          </div>

          {/* Catalog Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {catalogTools.map((tool) => (
              <div
                key={tool.id}
                className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {tool.categoryId || tool.category}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteTool(tool.slug);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                      title={isEs ? 'Favorito' : 'Favorite'}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFavoriteTool(tool.slug) ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </div>

                  <div 
                    onClick={() => onNavigate(`/tool/${tool.slug}`)}
                    className="cursor-pointer space-y-2"
                  >
                    <ToolVisualIllustration slug={tool.slug} size="compact" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {tool.name[lang] || tool.name.es}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {tool.shortDescription[lang] || tool.shortDescription.es}
                      </p>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => onNavigate(`/tool/${tool.slug}`)}
                  className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 cursor-pointer"
                >
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">100% Local</span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:underline">
                    {isEs ? 'Usar' : 'Use'} →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Non-intrusive AdSlot */}
        <InContentAd />

        {/* ========================================================================= */}
        {/* 6. SECCIÓN DE GUÍAS ÚTILES (SIN FRASES DE CUMPLIMIENTO / SIN CUOTAS) */}
        {/* ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <span>{isEs ? 'Guías Útiles y Tutoriales Prácticos' : 'Useful Guides & Practical Tutorials'}</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {isEs
                  ? 'Aprende paso a paso con nuestras guías detalladas para estudiantes, profesionales e investigadores.'
                  : 'Step-by-step verified tutorials across citations, document conversions, and digital productivity.'}
              </p>
            </div>

            <button
              onClick={() => onNavigate('/guides')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer shrink-0"
            >
              <span>{isEs ? 'Explorar todas las guías' : 'Explore all guides'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredGuides.map((guide) => (
              <article
                key={guide.slug}
                onClick={() => onNavigate(`/guide/${guide.slug}`)}
                className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      {guide.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {guide.readTime || '4 min'}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-2">
                    {guide.title[lang] || guide.title.es}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {guide.summary[lang] || guide.summary.es}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>{isEs ? 'Leer guía completa' : 'Read tutorial'}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. PREGUNTAS FRECUENTES (FAQ) */}
        {/* ========================================================================= */}
        <section className="max-w-4xl mx-auto px-4 py-4 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <HelpCircle className="w-4 h-4" />
              <span>{isEs ? 'Dudas Comunes' : 'Common Questions'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {isEs ? 'Preguntas Frecuentes sobre Toolbox Word' : 'Frequently Asked Questions'}
            </h2>
          </div>

          <div className="space-y-4 pt-2">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {isEs 
                  ? '1. ¿Es realmente seguro procesar mis archivos en Toolbox Word?' 
                  : '1. Is it truly safe to process my files on Toolbox Word?'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isEs
                  ? 'Totalmente seguro. En Toolbox Word el procesamiento ocurre íntegramente dentro de tu navegador web mediante APIs nativas y WebAssembly. Tus documentos nunca son enviados a servidores externos ni quedan almacenados en la nube.'
                  : '100% safe. Everything is processed inside your browser sandbox. Your files are never sent across the internet to external cloud servers.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {isEs 
                  ? '2. ¿El archivo Word (.docx) generado desde PDF es editable en Office y Google Docs?' 
                  : '2. Is the Word file (.docx) generated from PDF editable in Office and Google Docs?'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isEs
                  ? 'Sí. El archivo resultante es un documento DOCX estándar compatible con Microsoft Word 2010–2024, Microsoft 365, Google Docs, LibreOffice Writer y Pages de Apple, listo para editar y redactar.'
                  : 'Yes. It generates a standard international DOCX file fully editable in Microsoft Word 2010–2024, Microsoft 365, Google Docs, LibreOffice, and Pages.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {isEs 
                  ? '3. ¿Cómo funciona la extracción automática en el Generador de Citas?' 
                  : '3. How does auto-extraction work in the Citation Generator?'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isEs
                  ? 'Solo tienes que pegar el enlace de una página web, periódico o el código DOI de un artículo científico. El sistema obtiene el título, autor, sitio y fecha automáticamente para que no tengas que escribirlo manualmente.'
                  : 'Simply paste the URL or DOI. The system parses metadata to retrieve author, title, site, and date automatically.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {isEs 
                  ? '4. ¿Tengo que pagar o registrarme para usar las herramientas?' 
                  : '4. Do I need to pay or create an account to use the tools?'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isEs
                  ? 'No. Todas las herramientas de Toolbox Word son 100% gratuitas, sin necesidad de crear cuenta, sin introducir tarjetas de crédito y sin marcas de agua artificiales en tus descargas. El registro es completamente opcional si deseas guardar favoritos.'
                  : 'No. All tools are free forever with no required registration, no payment, and no intrusive watermarks.'}
              </p>
            </div>
          </div>
        </section>

      </div>
    </LateralAdLayout>
  );
};
