import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { Task, Level } from '@/lib/types';
import { LEVELS } from '@/lib/helpers';
import TaskRunner from '@/components/TaskRunner';
import { BookOpen, ArrowLeft, Clock } from 'lucide-react';

export default function Lesen() {
  return <SkillPage skill="lesen" titleKey="lesen" icon={BookOpen} />;
}

interface SkillPageProps {
  skill: 'lesen' | 'hoeren';
  titleKey: 'lesen' | 'hoeren';
  icon: typeof BookOpen;
}

export function SkillPage({ skill, titleKey, icon: Icon }: SkillPageProps) {
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
      <div>
        <button
          onClick={() => setActiveTask(null)}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('back')}
        </button>
        <TaskRunner task={activeTask} mode={skill} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{t(titleKey)}</h1>
          <p className="text-sm text-slate-500">{t('tagline')}</p>
        </div>
      </div>

      {/* Level selector */}
      <div className="flex flex-wrap gap-2">
        {LEVELS.map((lvl) => (
          <button
            key={lvl}
            onClick={() => setSelectedLevel(lvl)}
            className={`level-pill ${
              selectedLevel === lvl
                ? 'bg-sky-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
        </div>
      ) : !selectedLevel ? (
        <div className="card p-12 text-center text-slate-400">{t('selectLevel')}</div>
      ) : tasks.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">{t('noTasks')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => setActiveTask(task)}
              className="card p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="badge bg-sky-50 text-sky-600">{task.level}</span>
                  {task.exam_type && <span className="badge bg-slate-100 text-slate-600">{task.exam_type}</span>}
                </div>
                {task.teil_number && <span className="text-xs text-slate-400">Teil {task.teil_number}</span>}
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">{task.title}</h3>
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
