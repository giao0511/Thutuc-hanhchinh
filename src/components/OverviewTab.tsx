import React from 'react';
import { Task, TabKey, Language } from '../types.ts';
import { translations } from '../data/translations.ts';
import { CheckCircle2, Clock, Activity, ArrowRight, Layers, Cpu, GitFork, Sparkles } from 'lucide-react';

interface OverviewTabProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  stateInteractionsCount: number;
  onNavigateTab: (tab: TabKey) => void;
  onOpenQuickAdd: () => void;
  language: Language;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  tasks,
  onToggleTask,
  stateInteractionsCount,
  onNavigateTab,
  onOpenQuickAdd,
  language,
}) => {
  const t = translations[language];

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const activeTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const pillarIcons = [
    <Layers key="layers" className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
    <Cpu key="cpu" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    <GitFork key="git" className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
    <Sparkles key="sparkles" className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
  ];

  const recentTasks = tasks.slice(0, 4);

  return (
    <div className="space-y-10">
      {/* Hero Welcome Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 text-white p-8 sm:p-10 border border-slate-800 shadow-sm">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-300">
            <span>React 19</span>
            <span aria-hidden="true">·</span>
            <span>TypeScript</span>
            <span aria-hidden="true">·</span>
            <span>Tailwind CSS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance leading-tight">
            {t.overview.title}
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
            {t.overview.subtitle}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('tasks')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg shadow-sm transition-colors active:scale-95 whitespace-nowrap"
            >
              <span>{t.overview.goToTasks}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateTab('state')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors whitespace-nowrap"
            >
              <span>{t.overview.goToState}</span>
            </button>
            <button
              onClick={() => onNavigateTab('learning')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors whitespace-nowrap"
            >
              <span>{t.overview.goToLearning}</span>
            </button>
          </div>
        </div>
      </section>

      {/* KPI Stats Strip */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
              <span>{t.overview.stats.totalTasks}</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {totalTasks}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span>{activeTasks} {t.tasks.active.toLowerCase()}</span>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
              <span>{t.overview.stats.completedTasks}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
              {completedTasks}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span>{totalTasks > 0 ? `${completedTasks}/${totalTasks}` : '0'}</span>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
              <span>{t.overview.stats.completionRate}</span>
              <Activity className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
              {completionRate}%
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
              <span>{t.overview.stats.stateInteractions}</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {stateInteractionsCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span>{language === 'vi' ? 'Lượt đổi State' : 'State changes logged'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars Section */}
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t.overview.pillarsTitle}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {language === 'vi'
              ? 'Nền tảng kiến trúc giúp React trở thành thư viện giao diện người dùng phổ biến nhất.'
              : 'Architectural foundation making React the standard for interactive user interfaces.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {t.overview.pillars.map((pillar, idx) => (
            <div
              key={pillar.title}
              className="p-5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700/60 shrink-0">
                  {pillarIcons[idx]}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {pillar.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {pillar.desc}
                  </p>
                  <div className="pt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 font-mono">
                    {pillar.highlight}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Tasks Preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t.overview.recentTasksTitle}
          </h2>
          <button
            onClick={() => onNavigateTab('tasks')}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
          >
            <span>{language === 'vi' ? 'Xem tất cả' : 'View all'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTasks.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.overview.noTasks}</p>
            <button
              onClick={onOpenQuickAdd}
              className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              {t.tasks.addNew}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggleTask(task.id)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        task.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{t.tasks.categories[task.category]}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{t.tasks.priority[task.priority]}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400 dark:text-slate-500 font-mono shrink-0">
                  {task.dueDate || 'No date'}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
