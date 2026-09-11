import React, { useState } from 'react';

interface AdSlotProps {
  slotId?: string;
  format?: 'horizontal' | 'rectangle' | 'responsive' | 'vertical';
  className?: string;
}

/**
 * Standard AdSlot with reserved space to prevent Cumulative Layout Shift (CLS).
 * Completely non-intrusive, never blocks navigation, never covers buttons or forms.
 */
export const AdSlot: React.FC<AdSlotProps> = ({ format = 'horizontal', className = '' }) => {
  const [enabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('toolbox_ads_active') === 'true';
    }
    return false;
  });

  const minHeightClass = format === 'vertical' ? 'min-h-[600px]' : 'min-h-[90px]';

  return (
    <div className={`w-full text-center select-none ${className}`} aria-label="Espacio publicitario">
      <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
        Publicidad
      </span>
      <div className={`w-full ${minHeightClass} rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center p-3 transition-colors`}>
        {enabled ? (
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={(import.meta as any).env?.VITE_ADSENSE_CLIENT || 'ca-pub-placeholder'}
            data-ad-slot="1234567890"
            data-ad-format={format === 'vertical' ? 'vertical' : 'auto'}
            data-full-width-responsive="true"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              Espacio publicitario no invasivo
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Horizontal in-content ad placed strictly between major content sections.
 * Has sufficient margins, zero confusion with buttons, zero overlap.
 */
export const InContentAd: React.FC<{ className?: string }> = ({ className = '' }) => (
  <aside aria-label="Anuncio contextual" className={`my-8 max-w-5xl mx-auto px-4 ${className}`}>
    <AdSlot format="responsive" />
  </aside>
);

export const BannerAd = InContentAd;

export const TopAd: React.FC<{ className?: string }> = ({ className = '' }) => (
  <aside aria-label="Anuncio superior" className={`my-4 max-w-5xl mx-auto px-4 ${className}`}>
    <AdSlot format="horizontal" />
  </aside>
);

export const BottomAd: React.FC<{ className?: string }> = ({ className = '' }) => (
  <aside aria-label="Anuncio inferior" className={`my-8 max-w-5xl mx-auto px-4 ${className}`}>
    <AdSlot format="horizontal" />
  </aside>
);

/**
 * Lateral Skyscraper Ads (Left and Right).
 * Prioritized on large PC screens (2xl: >=1536px), sitting in the outer margins
 * completely outside the main content container.
 * Strictly hidden on mobile and tablet to preserve clean responsive layouts.
 */
export const LateralAdLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative w-full">
      {/* Left Lateral Skyscraper (Visible only on very wide desktop screens >= 1536px) */}
      <aside 
        aria-label="Anuncio lateral izquierdo"
        className="hidden 2xl:block fixed left-4 top-28 w-[140px] z-10 pointer-events-auto"
      >
        <div className="sticky top-28 w-full">
          <AdSlot format="vertical" className="w-[140px]" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="w-full">
        {children}
      </main>

      {/* Right Lateral Skyscraper (Visible only on very wide desktop screens >= 1536px) */}
      <aside 
        aria-label="Anuncio lateral derecho"
        className="hidden 2xl:block fixed right-4 top-28 w-[140px] z-10 pointer-events-auto"
      >
        <div className="sticky top-28 w-full">
          <AdSlot format="vertical" className="w-[140px]" />
        </div>
      </aside>
    </div>
  );
};
