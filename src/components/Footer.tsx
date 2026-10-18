import React from 'react';
import { Language } from '../types.ts';
import { translations } from '../data/translations.ts';

interface FooterProps {
  language: Language;
}

export const Footer: React.FC<FooterProps> = ({ language }) => {
  const t = translations[language];

  return (
    <footer className="mt-16 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <p>{t.footer.copyright}</p>
        <div className="flex items-center gap-4">
          <span>{t.footer.tip}</span>
        </div>
      </div>
    </footer>
  );
};
