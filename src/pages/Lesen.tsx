import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { Task, Level } from '@/lib/types';
import { LEVELS } from '@/lib/helpers';
import TaskRunner from '@/components/TaskRunner';
import { BookOpen, ArrowLeft, Clock, FileText } from 'lucide-react';

export default function Lesen() {
  return <SkillPage skill="lesen" titleKey="lesen" icon={BookOpen} accentColor="#0ea5e9" />;
}

interface SkillPageProps {
  skill: 'lesen' | 'hoeren';
  titleKey: 'lesen' | 'hoeren';
  icon: typeof BookOpen;
  accentColor: string;
}

export function SkillPage({ skill, titleKey, icon: Icon, accentColor }: SkillPageProps) {
  const { t, profile } = useStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(profile?.target_level || null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedLevel) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('skill', skill)
        .eq('level', selectedLevel)
        .order('created_at', { ascending: true });
      setTasks(data || []);
      setLoading(false);
    })();
  }, [skill, selectedLevel]);

  if (activeTask) {
    return (
      <div className="animate-fade-in">
        <button
          onClick={() => setActiveTask(null)}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4 group transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {t('back')}
        </button>
        <TaskRunner task={activeTask} mode={skill} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 animate-slide-down">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: `${accentColor}15`, color: accentColor, boxShadow: `0 4px 14px ${accentColor}25` }}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{t(titleKey)}</h1>
          <p className="text-sm text-slate-500">{t('tagline')}</p>
        </div>
      </div>

      {/* Level selector */}
      <div className="flex flex-wrap gap-2">
        {LEVELS.map((lvl, i) => (
          <button
            key={lvl}
            onClick={() => setSelectedLevel(lvl)}
            style={selectedLevel === lvl
              ? { background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, animationDelay: `${i * 0.03}s` }
              : { animationDelay: `${i * 0.03}s` }}
            className={`level-pill animate-slide-down ${
              selectedLevel === lvl
                ? 'text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-3 border-slate-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      ) : !selectedLevel ? (
        <div className="card p-16 text-center">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400">{t('selectLevel')}</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="card p-16 text-center">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400">{t('noTasks')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task, i) => (
            <button
              key={task.id}
              onClick={() => setActiveTask(task)}
              style={{ animationDelay: `${i * 0.05}s` }}
              className="card card-hover p-5 text-left group animate-slide-up relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
              />
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="badge"
                    style={{ background: `${accentColor}15`, color: accentColor }}
                  >
                    {task.level}
                  </span>
                  {task.exam_type && <span className="badge bg-slate-100 text-slate-600">{task.exam_type}</span>}
                </div>
                {task.teil_number && <span className="text-xs text-slate-400 font-medium">Teil {task.teil_number}</span>}
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">{task.title}</h3>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {task.content.questions?.length || 0} {t('question').toLowerCase()}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
