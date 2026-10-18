import React from 'react';
import { TabKey, Language } from '../types.ts';
import { translations } from '../data/translations.ts';
import { Plus, Sun, Moon, Globe, Menu, X } from 'lucide-react';

interface HeaderProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  language: Language;
  onToggleLanguage: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  onOpenQuickAdd: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  language,
  onToggleLanguage,
  isDark,
  onToggleDark,
  onOpenQuickAdd,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const t = translations[language];

  const navItems: { key: TabKey; label: string }[] = [
    { key: 'overview', label: t.nav.overview },
    { key: 'tasks', label: t.nav.tasks },
    { key: 'state', label: t.nav.state },
    { key: 'learning', label: t.nav.learning },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand wordmark (1 line, single element) */}
          <button
            onClick={() => {
              onSelectTab('overview');
              setMobileMenuOpen(false);
            }}
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
          >
            {t.brand}
          </button>

          {/* Zone 2: 4 clean single-line nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = currentTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onSelectTab(item.key)}
                  className={`relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary action & utilities */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick Add Button */}
            <button
              onClick={onOpenQuickAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t.nav.quickAdd}</span>
            </button>

            {/* Language toggle */}
            <button
              onClick={onToggleLanguage}
              title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle language"
            >
              <div className="flex items-center gap-1 text-xs font-semibold px-1">
                <Globe className="w-3.5 h-3.5" />
                <span className="uppercase">{language}</span>
              </div>
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={onToggleDark}
              title={isDark ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelectTab(item.key);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
