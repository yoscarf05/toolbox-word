import { ExtractedCitationMetadata, Language } from '../types';

/**
 * Intelligent metadata extractor for citation generator.
 * Identifies Title, Authors, Publication Date, Site Name, Publisher, DOI, and Source Type.
 * Follows strict distinction between author, organization, site, and URL.
 */

// Helper to format ISO date string to localized date
function formatDate(dateStr: string, lang: Language): { year: string; fullDate: string } {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const yearMatch = dateStr.match(/\b(19\d{2}|20\d{2})\b/);
      return {
        year: yearMatch ? yearMatch[1] : '',
        fullDate: dateStr
      };
    }
    const year = d.getFullYear().toString();
    const fullDate = d.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return { year, fullDate };
  } catch {
    return { year: '', fullDate: '' };
  }
}

// Clean HTML entities and tags
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .trim();
}

// Clean author name into "Surname, Name" if possible
function formatAuthorName(rawAuthor: string): string {
  if (!rawAuthor) return '';
  const cleaned = cleanText(rawAuthor).replace(/^Por\s+/i, '').replace(/^By\s+/i, '').trim();
  
  // If already has comma or multiple words
  if (cleaned.includes(',')) return cleaned;
  
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[1]}, ${parts[0]}`;
  if (parts.length >= 3) {
    const surname = parts[parts.length - 1];
    const forenames = parts.slice(0, parts.length - 1).join(' ');
    return `${surname}, ${forenames}`;
  }
  return cleaned;
}

// Extract DOI from string
function findDoi(str: string): string | null {
  const match = str.match(/\b(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)\b/);
  return match ? match[1].replace(/[,.)]+$/, '') : null;
}

// Clean site name from domain
function getDomainSiteName(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    const host = u.hostname.replace(/^www\./, '');
    
    // Known domain mappings
    const KNOWN_DOMAINS: Record<string, string> = {
      'elpais.com': 'El País',
      'elmundo.es': 'El Mundo',
      'nytimes.com': 'The New York Times',
      'bbc.com': 'BBC News',
      'bbc.co.uk': 'BBC News',
      'nature.com': 'Nature',
      'sciencedirect.com': 'ScienceDirect',
      'wikipedia.org': 'Wikipedia',
      'es.wikipedia.org': 'Wikipedia, La enciclopedia libre',
      'who.int': 'Organización Mundial de la Salud (OMS)',
      'un.org': 'Naciones Unidas',
      'cdc.gov': 'Centers for Disease Control and Prevention',
      'scielo.org': 'SciELO',
      'redalyc.org': 'Redalyc',
      'youtube.com': 'YouTube',
      'medium.com': 'Medium',
      'theguardian.com': 'The Guardian',
      'reuters.com': 'Reuters',
      'nationalgeographic.com': 'National Geographic'
    };

    if (KNOWN_DOMAINS[host]) return KNOWN_DOMAINS[host];
    for (const key in KNOWN_DOMAINS) {
      if (host.endsWith('.' + key) || host === key) return KNOWN_DOMAINS[key];
    }

    // Capitalize domain parts: e.g. "techcrunch.com" -> "Techcrunch"
    const parts = host.split('.');
    if (parts.length >= 2) {
      const main = parts[0];
      return main.charAt(0).toUpperCase() + main.slice(1);
    }
    return host;
  } catch {
    return '';
  }
}

/**
 * Main metadata extraction function
 */
export async function extractCitationFromInput(
  input: string,
  lang: Language
): Promise<ExtractedCitationMetadata> {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error(lang === 'es' ? 'Ingresa una URL o DOI válido.' : 'Please enter a valid URL or DOI.');
  }

  // 1. Check if input is a DOI or DOI URL
  const detectedDoi = findDoi(trimmed);
  if (detectedDoi && (trimmed.startsWith('10.') || trimmed.includes('doi.org/'))) {
    try {
      return await fetchFromCrossRef(detectedDoi, lang);
    } catch {
      // If CrossRef fails, continue with standard URL scraper below
    }
  }

  // 2. Normalize URL
  let targetUrl = trimmed;
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }

  let html = '';

  // 3. Try internal server endpoint first (bypasses CORS in dev / server)
  try {
    const res = await fetch(`/api/extract-metadata?url=${encodeURIComponent(targetUrl)}`, {
      headers: { 'Accept': 'text/html,application/json' }
    });
    if (res.ok) {
      html = await res.text();
    }
  } catch {
    // continue to client-side fallback
  }

  // 4. Fallback to public CORS proxy if server endpoint returned empty or failed
  if (!html || html.startsWith('{"error"')) {
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        html = await res.text();
      }
    } catch {
      // Fallback to domain heuristics
    }
  }

  // 5. If we have HTML, parse DOM
  if (html && html.length > 50) {
    return parseHtmlMetadata(html, targetUrl, lang);
  }

  // 6. Last-resort heuristic parse based on URL structure
  return fallbackHeuristicParse(targetUrl, lang);
}

/**
 * Query official CrossRef Open API for DOIs
 */
async function fetchFromCrossRef(doi: string, lang: Language): Promise<ExtractedCitationMetadata> {
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });

  if (!res.ok) {
    throw new Error('CrossRef lookup failed');
  }

  const data = await res.json();
  const item = data.message;

  const title = item.title?.[0] ? cleanText(item.title[0]) : '';
  const journalName = item['container-title']?.[0] ? cleanText(item['container-title'][0]) : '';
  const publisher = item.publisher ? cleanText(item.publisher) : '';
  
  // Format authors
  const authorList = (item.author || []).map((a: any) => {
    if (a.family && a.given) {
      return `${a.family}, ${a.given}`;
    }
    return a.name || a.family || '';
  }).filter(Boolean).join('; ');

  // Extract year
  const dateParts = item['published-print']?.['date-parts']?.[0] 
    || item['published-online']?.['date-parts']?.[0] 
    || item.created?.['date-parts']?.[0];
  const year = dateParts?.[0] ? dateParts[0].toString() : '';

  let publicationDate = '';
  if (dateParts && dateParts.length >= 3) {
    publicationDate = `${dateParts[0]}-${String(dateParts[1]).padStart(2, '0')}-${String(dateParts[2]).padStart(2, '0')}`;
  }

  return {
    title,
    authors: authorList,
    year,
    publicationDate,
    journalName,
    publisher,
    siteName: journalName || publisher,
    volume: item.volume || '',
    issue: item.issue || '',
    pages: item.page || '',
    url: item.URL || `https://doi.org/${doi}`,
    doi,
    sourceType: 'journal',
    confidenceScore: 98,
    rawSource: 'CrossRef Official Academic Index'
  };
}

/**
 * Parse HTML metadata using standard DOMParser
 */
function parseHtmlMetadata(html: string, url: string, lang: Language): ExtractedCitationMetadata {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Helper for meta tags
  const getMeta = (...selectors: string[]): string => {
    for (const sel of selectors) {
      const el = doc.querySelector(sel);
      if (el) {
        const val = el.getAttribute('content') || el.getAttribute('value') || el.textContent;
        if (val && val.trim()) return cleanText(val.trim());
      }
    }
    return '';
  };

  // 1. Extract Title
  let title = getMeta(
    'meta[name="citation_title"]',
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'meta[name="dc.title"]',
    'meta[name="title"]'
  );

  if (!title) {
    const titleEl = doc.querySelector('title');
    if (titleEl && titleEl.textContent) {
      title = cleanText(titleEl.textContent);
    }
  }

  // 2. Extract Site Name / Publisher
  let siteName = getMeta(
    'meta[property="og:site_name"]',
    'meta[name="citation_journal_title"]',
    'meta[name="citation_publisher"]',
    'meta[name="publisher"]',
    'meta[name="dc.publisher"]',
    'meta[name="application-name"]'
  );

  if (!siteName) {
    siteName = getDomainSiteName(url);
  }

  // Clean title of trailing site name (e.g. "Título del artículo - El País" -> "Título del artículo")
  if (siteName && title.includes(siteName)) {
    title = title.replace(new RegExp(`\\s*[-|–—•:]\\s*${siteName}.*$`, 'i'), '').trim();
  }

  // 3. Extract Authors
  let authors = '';
  // Check citation_author (multiple tags possible)
  const citationAuthors = doc.querySelectorAll('meta[name="citation_author"]');
  if (citationAuthors.length > 0) {
    const authorArr: string[] = [];
    citationAuthors.forEach((el) => {
      const val = el.getAttribute('content');
      if (val && val.trim()) authorArr.push(formatAuthorName(val.trim()));
    });
    authors = authorArr.join('; ');
  }

  if (!authors) {
    const rawAuthor = getMeta(
      'meta[name="author"]',
      'meta[property="article:author"]',
      'meta[name="dc.creator"]',
      'meta[name="twitter:creator"]'
    );
    if (rawAuthor) {
      authors = formatAuthorName(rawAuthor);
    }
  }

  // 4. Try JSON-LD if authors or title are still missing
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  let jsonLdType = '';
  jsonLdScripts.forEach((script) => {
    try {
      const json = JSON.parse(script.textContent || '');
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        if (!title && (item.headline || item.name)) {
          title = cleanText(item.headline || item.name);
        }
        if (!authors && item.author) {
          if (typeof item.author === 'string') {
            authors = formatAuthorName(item.author);
          } else if (Array.isArray(item.author)) {
            authors = item.author.map((a: any) => formatAuthorName(a.name || a)).filter(Boolean).join('; ');
          } else if (item.author.name) {
            authors = formatAuthorName(item.author.name);
          }
        }
        if (!siteName && item.publisher?.name) {
          siteName = cleanText(item.publisher.name);
        }
        if (item['@type']) {
          jsonLdType = String(item['@type']).toLowerCase();
        }
      }
    } catch {
      // ignore invalid json-ld
    }
  });

  // 5. Extract Dates
  const rawDate = getMeta(
    'meta[property="article:published_time"]',
    'meta[name="citation_publication_date"]',
    'meta[name="citation_date"]',
    'meta[name="dc.date"]',
    'meta[name="date"]',
    'meta[name="pubdate"]'
  );

  const rawModDate = getMeta(
    'meta[property="article:modified_time"]',
    'meta[property="og:updated_time"]'
  );

  const { year, fullDate: publicationDate } = formatDate(rawDate || rawModDate || '', lang);
  const { fullDate: updatedDate } = formatDate(rawModDate || '', lang);

  // 6. Extract DOI
  let doi = getMeta('meta[name="citation_doi"]', 'meta[name="dc.identifier"]');
  if (!doi) {
    const doiFound = findDoi(html);
    if (doiFound) doi = doiFound;
  }

  // 7. Academic fields
  const journalName = getMeta('meta[name="citation_journal_title"]');
  const volume = getMeta('meta[name="citation_volume"]');
  const issue = getMeta('meta[name="citation_issue"]');
  const firstPage = getMeta('meta[name="citation_firstpage"]');
  const lastPage = getMeta('meta[name="citation_lastpage"]');
  const pages = firstPage ? (lastPage ? `${firstPage}-${lastPage}` : firstPage) : '';

  // 8. Determine Source Type
  let sourceType: ExtractedCitationMetadata['sourceType'] = 'website';
  if (journalName || doi || jsonLdType.includes('scholarly') || jsonLdType.includes('academic')) {
    sourceType = 'journal';
  } else if (url.includes('youtube.com') || url.includes('vimeo.com') || jsonLdType.includes('video')) {
    sourceType = 'video';
  } else if (url.toLowerCase().endsWith('.pdf')) {
    sourceType = 'pdf';
  } else if (jsonLdType.includes('newsarticle') || /elpais|elmundo|nytimes|theguardian|bbc/i.test(url)) {
    sourceType = 'newspaper';
  }

  // If author is identical to siteName or empty, default organization
  if (!authors && siteName) {
    authors = siteName;
  }

  // Ensure Toolbox Word is NEVER confused with the source author or site
  if (!url.includes('toolbox') && (authors.toLowerCase().includes('toolbox word') || siteName.toLowerCase().includes('toolbox word'))) {
    authors = getDomainSiteName(url) || 'Autor';
    siteName = getDomainSiteName(url);
  }

  return {
    title: title || (lang === 'es' ? 'Página web' : 'Webpage'),
    authors: authors || siteName || (lang === 'es' ? 'Organización' : 'Organization'),
    siteName: siteName || getDomainSiteName(url),
    publisher: siteName,
    publicationDate,
    updatedDate,
    year: year || new Date().getFullYear().toString(),
    url,
    doi: doi || undefined,
    journalName: journalName || undefined,
    volume: volume || undefined,
    issue: issue || undefined,
    pages: pages || undefined,
    sourceType,
    confidenceScore: title && (authors || siteName) ? 90 : 60,
    rawSource: 'Web Metadata & Open Graph'
  };
}

/**
 * Fallback parser when URL cannot be fetched directly
 */
function fallbackHeuristicParse(url: string, lang: Language): ExtractedCitationMetadata {
  const domainName = getDomainSiteName(url);
  let title = domainName;
  
  try {
    const u = new URL(url);
    const pathSegments = u.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      const last = pathSegments[pathSegments.length - 1]
        .replace(/\.[a-zA-Z0-9]+$/, '')
        .replace(/[-_]+/g, ' ');
      if (last.length > 3) {
        title = last.charAt(0).toUpperCase() + last.slice(1);
      }
    }
  } catch {
    // fallback
  }

  return {
    title,
    authors: domainName || (lang === 'es' ? 'Redacción' : 'Staff'),
    siteName: domainName,
    publisher: domainName,
    year: new Date().getFullYear().toString(),
    publicationDate: new Date().toISOString().split('T')[0],
    url,
    sourceType: 'website',
    confidenceScore: 40,
    rawSource: 'Domain Analysis'
  };
}
