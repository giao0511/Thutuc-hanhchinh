import React, { useState, useEffect, useRef } from 'react';
import { StateHistoryItem, Language } from '../types.ts';
import { translations } from '../data/translations.ts';
import {
  RotateCcw,
  Play,
  Pause,
  Undo2,
  Trash2,
  Code2,
  Sliders,
  Check,
  Copy,
} from 'lucide-react';

interface StateCounterTabProps {
  counterValue: number;
  onUpdateCounter: (newValue: number, actionName: string) => void;
  history: StateHistoryItem[];
  onUndo: () => void;
  onClearHistory: () => void;
  language: Language;
}

export const StateCounterTab: React.FC<StateCounterTabProps> = ({
  counterValue,
  onUpdateCounter,
  history,
  onUndo,
  onClearHistory,
  language,
}) => {
  const t = translations[language];

  // Counter local configs
  const [step, setStep] = useState<number>(1);
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(false);
  const [autoSpeedMs, setAutoSpeedMs] = useState<number>(1000);
  const autoIntervalRef = useRef<number | null>(null);

  // Interval auto-tick effect
  useEffect(() => {
    if (isAutoRunning) {
      autoIntervalRef.current = window.setInterval(() => {
        onUpdateCounter(counterValue + step, `Auto +${step}`);
      }, autoSpeedMs);
    } else {
      if (autoIntervalRef.current) clearInterval(autoIntervalRef.current);
    }

    return () => {
      if (autoIntervalRef.current) clearInterval(autoIntervalRef.current);
    };
  }, [isAutoRunning, counterValue, step, autoSpeedMs, onUpdateCounter]);

  // Card Props Customizer State
  const [cardTitle, setCardTitle] = useState('React Component Demo');
  const [cardDesc, setCardDesc] = useState('Linh kiện này nhận các thuộc tính (Props) từ state và render theo thời gian thực.');
  const [cardColor, setCardColor] = useState<'indigo' | 'emerald' | 'amber' | 'rose' | 'violet'>('indigo');
  const [cardRadius, setCardRadius] = useState<number>(12);
  const [cardShadow, setCardShadow] = useState<boolean>(true);
  const [showBadge, setShowBadge] = useState<boolean>(true);
  const [badgeText, setBadgeText] = useState('Active');
  const [copiedCode, setCopiedCode] = useState(false);

  // Controlled Form State
  const [formData, setFormData] = useState({
    fullName: 'Nguyễn Văn A',
    email: 'developer@example.com',
    role: 'Frontend Developer',
    subscribeNewsletter: true,
  });

  const handleCopyJSX = () => {
    const code = `<CustomCard
  title="${cardTitle}"
  description="${cardDesc}"
  color="${cardColor}"
  borderRadius="${cardRadius}px"
  hasShadow={${cardShadow}}
  ${showBadge ? `badge="${badgeText}"` : ''}
/>`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const colorStyles = {
    indigo: {
      border: 'border-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-600 dark:text-indigo-400',
      badge: 'bg-indigo-600 text-white',
    },
    emerald: {
      border: 'border-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-600 text-white',
    },
    amber: {
      border: 'border-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-600 text-white',
    },
    rose: {
      border: 'border-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-600 dark:text-rose-400',
      badge: 'bg-rose-600 text-white',
    },
    violet: {
      border: 'border-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-950/40',
      text: 'text-violet-600 dark:text-violet-400',
      badge: 'bg-violet-600 text-white',
    },
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t.state.title}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
          {t.state.subtitle}
        </p>
      </div>

      {/* Section 1: Advanced Counter */}
      <section className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t.state.counter.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.state.counter.desc}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onUndo}
              disabled={history.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>{t.state.counter.undo}</span>
            </button>
            <button
              onClick={() => onUpdateCounter(0, 'Reset')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.state.counter.reset}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Counter Display */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              {t.state.counter.currentValue}
            </span>
            <div className="text-6xl sm:text-7xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">
              {counterValue}
            </div>

            {/* Quick buttons */}
            <div className="flex items-center gap-2 mt-6">
              <button
                onClick={() => onUpdateCounter(counterValue - step, `Trừ ${step}`)}
                className="w-12 h-12 flex items-center justify-center text-xl font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs transition-colors active:scale-95"
              >
                -{step}
              </button>
              <button
                onClick={() => onUpdateCounter(counterValue + step, `Cộng ${step}`)}
                className="w-12 h-12 flex items-center justify-center text-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors active:scale-95"
              >
                +{step}
              </button>
            </div>
          </div>

          {/* Controls: Step & Auto-ticker */}
          <div className="lg:col-span-7 space-y-5">
            {/* Step Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t.state.counter.step}
              </label>
              <div className="flex items-center gap-2">
                {[1, 5, 10, 50].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStep(s)}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      step === s
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    ±{s}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Interval Timer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {language === 'vi' ? 'Hiệu ứng Interval (useEffect)' : 'Interval Timer Effect'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'vi'
                      ? 'Tự động gọi hàm state updater sau mỗi khoảng thời gian định sẵn.'
                      : 'Automatically invokes state updater every interval.'}
                  </p>
                </div>

                <button
                  onClick={() => setIsAutoRunning(!isAutoRunning)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-xs ${
                    isAutoRunning
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isAutoRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isAutoRunning ? t.state.counter.stopAuto : t.state.counter.autoTick}</span>
                </button>
              </div>

              {/* Speed buttons */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {t.state.counter.speed}:
                </span>
                {[
                  { label: '0.5s', ms: 500 },
                  { label: '1.0s', ms: 1000 },
                  { label: '2.0s', ms: 2000 },
                ].map((speed) => (
                  <button
                    key={speed.ms}
                    onClick={() => setAutoSpeedMs(speed.ms)}
                    className={`px-2.5 py-1 text-xs rounded-md font-mono ${
                      autoSpeedMs === speed.ms
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    {speed.label}
                  </button>
                ))}
              </div>
            </div>

            {/* History stack log */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.state.counter.history} ({history.length})
                </span>
                {history.length > 0 && (
                  <button
                    onClick={onClearHistory}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{t.state.counter.clearHistory}</span>
                  </button>
                )}
              </div>

              <div className="max-h-28 overflow-y-auto space-y-1.5 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono">
                {history.length === 0 ? (
                  <p className="text-slate-400 py-1 text-center font-sans">
                    {t.state.counter.noHistory}
                  </p>
                ) : (
                  history.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-slate-600 dark:text-slate-400 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                    >
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{item.action}</span>
                      <span className="tabular-nums">
                        {item.previousValue} → <strong className="text-slate-900 dark:text-white">{item.newValue}</strong>
                      </span>
                      <span className="text-slate-400 text-2xs">{item.timestamp}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Props & Component Playground */}
      <section className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t.state.propsPlayground.title}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.state.propsPlayground.desc}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Form */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.state.propsPlayground.cardTitle}
              </label>
              <input
                type="text"
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.state.propsPlayground.cardDesc}
              </label>
              <textarea
                value={cardDesc}
                onChange={(e) => setCardDesc(e.target.value)}
                rows={2}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white resize-none"
              />
            </div>

            {/* Color Accent Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.state.propsPlayground.accentColor}
              </label>
              <div className="flex items-center gap-2">
                {(['indigo', 'emerald', 'amber', 'rose', 'violet'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCardColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      cardColor === c ? 'scale-110 border-slate-900 dark:border-white shadow-xs' : 'border-transparent'
                    } ${
                      c === 'indigo'
                        ? 'bg-indigo-600'
                        : c === 'emerald'
                        ? 'bg-emerald-600'
                        : c === 'amber'
                        ? 'bg-amber-500'
                        : c === 'rose'
                        ? 'bg-rose-600'
                        : 'bg-violet-600'
                    }`}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>

            {/* Radius slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>{t.state.propsPlayground.radius}</span>
                <span className="font-mono tabular-nums">{cardRadius}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                value={cardRadius}
                onChange={(e) => setCardRadius(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cardShadow}
                  onChange={(e) => setCardShadow(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Độ đổ bóng (Box Shadow)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBadge}
                  onChange={(e) => setShowBadge(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>{t.state.propsPlayground.showBadge}</span>
              </label>
            </div>

            {showBadge && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.state.propsPlayground.badgeText}
                </label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Live Preview & JSX Code */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Live Rendered Component
              </span>

              {/* Rendered Target Card */}
              <div
                style={{ borderRadius: `${cardRadius}px` }}
                className={`p-6 border bg-white dark:bg-slate-900 transition-all ${
                  colorStyles[cardColor].border
                } ${cardShadow ? 'shadow-md shadow-slate-200/50 dark:shadow-none' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {cardTitle || 'Untitled Card'}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {cardDesc || 'No description provided.'}
                    </p>
                  </div>

                  {showBadge && (
                    <span
                      className={`text-2xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${colorStyles[cardColor].badge}`}
                    >
                      {badgeText}
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className={`font-semibold ${colorStyles[cardColor].text}`}>
                    React Props Active
                  </span>
                  <span className="text-slate-400 font-mono tabular-nums">r: {cardRadius}px</span>
                </div>
              </div>
            </div>

            {/* Generated JSX code view */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{t.state.propsPlayground.codePreview}</span>
                </span>
                <button
                  onClick={handleCopyJSX}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-medium"
                >
                  {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Đã sao chép!' : 'Sao chép JSX'}</span>
                </button>
              </div>

              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800">
{`<CustomCard
  title="${cardTitle}"
  description="${cardDesc}"
  color="${cardColor}"
  borderRadius="${cardRadius}px"
  hasShadow={${cardShadow}}
  ${showBadge ? `badge="${badgeText}"` : ''}
/>`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Controlled Form Playground */}
      <section className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t.state.forms.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.state.forms.desc}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Inputs */}
          <div className="lg:col-span-6 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.state.forms.name}
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.state.forms.email}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.state.forms.role}
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Fullstack Engineer">Fullstack Engineer</option>
                <option value="UI/UX Designer">UI/UX Designer</option>
              </select>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.subscribeNewsletter}
                  onChange={(e) => setFormData({ ...formData, subscribeNewsletter: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>{t.state.forms.notifications}</span>
              </label>
            </div>
          </div>

          {/* JSON State Output */}
          <div className="lg:col-span-6 space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t.state.forms.jsonOutput}
            </span>
            <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed">
{JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
};
