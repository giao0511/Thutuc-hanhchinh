import React, { useState, useEffect, useMemo } from 'react';
import { Language } from '../types.ts';
import { translations } from '../data/translations.ts';
import {
  Heart,
  Bookmark,
  Monitor,
  Timer,
  Zap,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ReactLabTabProps {
  language: Language;
}

export const ReactLabTab: React.FC<ReactLabTabProps> = ({ language }) => {
  const t = translations[language];

  // Hook 1: useState demo
  const [likes, setLikes] = useState(12);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleToggleLike = () => {
    setIsLiked(!isLiked);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  // Hook 2: useEffect demo (Window resize + active uptime)
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);

    const interval = window.setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.clearInterval(interval);
    };
  }, []);

  // Hook 3: useMemo demo (Fibonacci computation)
  const [fibN, setFibN] = useState<number>(32);
  const [enableMemo, setEnableMemo] = useState<boolean>(true);
  const [calcTrigger, setCalcTrigger] = useState<number>(0);

  // Expensive calculation
  const calculateFibonacci = (n: number): number => {
    if (n <= 1) return n;
    let a = 0,
      b = 1;
    for (let i = 2; i <= n; i++) {
      const c = a + b;
      a = b;
      b = c;
    }
    return b;
  };

  // Measure time
  const [calcTimeMs, setCalcTimeMs] = useState<number>(0);
  const fibResult = useMemo(() => {
    const start = performance.now();
    const result = calculateFibonacci(fibN);
    const end = performance.now();
    setCalcTimeMs(Number((end - start).toFixed(4)));
    return result;
  }, [fibN, enableMemo ? null : calcTrigger]); // if memo disabled, recalculates every trigger

  // Hook 4: Props & Lifting State
  const [parentCount, setParentCount] = useState<number>(10);
  const [lastChildAction, setLastChildAction] = useState<string>('Khởi tạo');

  // Quiz Accordion state
  const [openQuizIndex, setOpenQuizIndex] = useState<number | null>(0);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t.learning.title}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
          {t.learning.subtitle}
        </p>
      </div>

      {/* Grid of 4 Interactive Hooks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: useState */}
        <div className="p-6 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t.learning.hooks.useState.title}
            </h2>
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono">
              Hook Cơ Bản
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {t.learning.hooks.useState.desc}
          </p>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              {t.learning.hooks.useState.demoLabel}
            </span>

            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleLike}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isLiked
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                <span>
                  {t.learning.hooks.useState.likes} ({likes})
                </span>
              </button>

              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isBookmarked
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                <span>
                  {isBookmarked
                    ? t.learning.hooks.useState.isBookmarked
                    : t.learning.hooks.useState.notBookmarked}
                </span>
              </button>
            </div>

            <div className="text-2xs font-mono text-slate-500 dark:text-slate-400 pt-1">
              State: <code className="text-indigo-600 dark:text-indigo-400">{`{ likes: ${likes}, isLiked: ${isLiked}, isBookmarked: ${isBookmarked} }`}</code>
            </div>
          </div>
        </div>

        {/* Card 2: useEffect */}
        <div className="p-6 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t.learning.hooks.useEffect.title}
            </h2>
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-mono">
              Lifecycle & Events
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {t.learning.hooks.useEffect.desc}
          </p>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Monitor className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.learning.hooks.useEffect.windowSize}:</span>
              </span>
              <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                {windowDimensions.width}px × {windowDimensions.height}px
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Timer className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.learning.hooks.useEffect.timerSeconds}:</span>
              </span>
              <span className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                {timerSeconds}s
              </span>
            </div>

            <p className="text-2xs text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800 pt-2 leading-normal">
              {t.learning.hooks.useEffect.timerNotice}
            </p>
          </div>
        </div>

        {/* Card 3: useMemo */}
        <div className="p-6 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t.learning.hooks.useMemo.title}
            </h2>
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-mono">
              Optimization
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {t.learning.hooks.useMemo.desc}
          </p>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.learning.hooks.useMemo.fibInput} (N):
              </label>
              <div className="flex items-center gap-2">
                {[20, 30, 40, 50].map((n) => (
                  <button
                    key={n}
                    onClick={() => setFibN(n)}
                    className={`px-2 py-1 text-xs rounded font-mono ${
                      fibN === n
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 dark:text-slate-400 font-mono">
                Fib({fibN}) =
              </span>
              <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                {fibResult.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">
                {t.learning.hooks.useMemo.renderCost}:
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                {calcTimeMs} ms
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Props & Component Hierarchy */}
        <div className="p-6 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t.learning.hooks.propsData.title}
            </h2>
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 font-mono">
              Props Down / Events Up
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {t.learning.hooks.propsData.desc}
          </p>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-semibold">
                {t.learning.hooks.propsData.parentState}:
              </span>
              <span className="font-mono tabular-nums text-lg font-bold text-violet-600 dark:text-violet-400">
                {parentCount}
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-2xs uppercase tracking-wider text-slate-400 font-semibold block">
                Component Con (Child Component)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setParentCount((prev) => prev + 5);
                    setLastChildAction('+5 qua callback');
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-md transition-colors"
                >
                  Gửi callback +5
                </button>
                <button
                  onClick={() => {
                    setParentCount((prev) => prev - 5);
                    setLastChildAction('-5 qua callback');
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                >
                  Gửi callback -5
                </button>
              </div>
            </div>

            <div className="text-2xs text-slate-500 dark:text-slate-400 font-mono">
              Sự kiện gần nhất: <strong className="text-slate-800 dark:text-slate-200">{lastChildAction}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* React Knowledge Check Accordion */}
      <section className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t.learning.quizTitle}
          </h2>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {t.learning.quizQuestions.map((q, idx) => {
            const isOpen = openQuizIndex === idx;
            return (
              <div key={q.q} className="py-3">
                <button
                  onClick={() => setOpenQuizIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left py-2 font-semibold text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <span>{q.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 pl-2 border-l-2 border-indigo-500 dark:border-indigo-400 leading-relaxed">
                    {q.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
