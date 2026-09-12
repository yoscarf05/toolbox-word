export type Language = 'es' | 'en' | 'pt' | 'fr' | 'de' | 'it';

export type Theme = 'light' | 'dark';
export type ThemeMode = 'system' | 'light' | 'dark';

export type CategoryId = 
  | 'pdf'
  | 'images'
  | 'text'
  | 'qr'
  | 'files'
  | 'productivity'
  | 'students'
  | 'business'
  | 'developer';

export interface CategoryInfo {
  id: CategoryId;
  name: { [key in Language]?: string };
  icon: any;
  description: { [key in Language]?: string };
  count?: number;
}

export type Category = CategoryInfo;

export interface FaqItem {
  question: { [key in Language]?: string };
  answer: { [key in Language]?: string };
}

export interface StepInstruction {
  step: number;
  title: { [key in Language]?: string };
  desc: { [key in Language]?: string };
}

export interface ToolDefinition {
  id: string;
  slug: string;
  categoryId: CategoryId;
  category?: CategoryId | string;
  name: { [key in Language]?: string };
  shortDescription: { [key in Language]?: string };
  fullDescription?: { [key in Language]?: string };
  icon: any;
  isPopular?: boolean;
  isNew?: boolean;
  badge?: string;
  processLocally: boolean; // Indicates 100% in-browser processing
  keywords: string[];
  steps?: StepInstruction[];
  faqs?: FaqItem[];
  relatedToolIds?: string[];
  relatedTools?: string[];
  exampleUse?: { [key in Language]?: string };
}

export type Tool = ToolDefinition;

export interface GuideArticle {
  id: string;
  slug: string;
  title: { [key in Language]?: string };
  summary: { [key in Language]?: string };
  category: string;
  readTimeMinutes?: number;
  readTime?: string;
  publishedAt?: string;
  relatedToolId?: string;
  relatedTools?: string[];
  content: { [key in Language]?: string };
  seoTitle?: { [key in Language]?: string };
  metaDescription?: { [key in Language]?: string };
  steps?: { title: string; desc: string }[];
}

export interface CookiePreferences {
  accepted: boolean;
  necessary: boolean;
  analytics: boolean;
  advertising: boolean;
}

export interface RecentToolItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  timestamp: number;
}

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferredLanguage?: Language;
  createdAt: number;
  role?: UserRole;
  permissions?: string[];
  totpEnabled?: boolean;
  status?: 'active' | 'blocked';
  isSuperAdmin?: boolean;
  isAdmin?: boolean;
}

export interface UserFavorites {
  tools: string[];
  guides: string[];
}

export interface UserHistoryItem {
  id: string;
  type: 'tool' | 'guide' | 'citation';
  title: string;
  slug?: string;
  meta?: string;
  timestamp: number;
}

export interface ExtractedCitationMetadata {
  title?: string;
  authors?: string;
  publicationDate?: string;
  updatedDate?: string;
  year?: string;
  siteName?: string;
  publisher?: string;
  url?: string;
  doi?: string;
  sourceType?: 'website' | 'journal' | 'book' | 'newspaper' | 'magazine' | 'video' | 'thesis' | 'pdf' | 'social' | 'other';
  journalName?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  institution?: string;
  confidenceScore?: number;
  rawSource?: string;
}
