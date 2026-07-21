import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { Task, Level } from '@/lib/types';
import { LEVELS, SKILL_META } from '@/lib/helpers';
import Layout from '@/components/Layout';
import TaskRunner from '@/components/TaskRunner';
import { BookOpen, Headphones, PenLine, Mic } from 'lucide-react';

const SKILL_ICONS: Record<string, typeof BookOpen> = { lesen: BookOpen, hoeren: Headphones, schreiben: PenLine, sprechen: Mic };

interface Props {
  skill: 'lesen' | 'hoeren' | 'schreiben' | 'sprechen';
}

export default function SkillPage({ skill }: Props) {
  const { t, profile } = useStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(profile?.target_level || 'B1');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const accentColor = SKILL_META[skill]?.color || '#0ea5e9';
  const Icon = SKILL_ICONS[skill];

  useEffect(() => {
    if (!selectedLevel) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase.from('tasks').select('*').eq('skill', skill).eq('level', selectedLevel).order('created_at', { ascending: false });
      setTasks(data || []);
      setLoading(false);
    })();
  }, [skill, selectedLevel]);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3 animate-slide-down">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `${accentColor}15`, color: accentColor, boxShadow: `0 4px 14px ${accentColor}25` }}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">{t(skill)}</h1>
            <p className="text-sm text-slate-500">{t('selectLevel')}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 animate-slide-down">
          {LEVELS.map((lvl, i) => (
            <button
              key={lvl}
              onClick={() => { setSelectedLevel(lvl); setActiveTask(null); }}
              style={selectedLevel === lvl
                ? { background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, animationDelay: `${i * 0.03}s` }
                : { animationDelay: `${i * 0.03}s` }}
              className={`level-pill animate-slide-down ${selectedLevel === lvl ? 'text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {activeTask ? (
          <div className="space-y-4">
            <button onClick={() => setActiveTask(null)} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">← {t('back')}</button>
            <TaskRunner task={activeTask} mode={skill === 'lesen' ? 'lesen' : skill === 'hoeren' ? 'hoeren' : 'lesen'} />
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12"><div className="w-10 h-10 border-3 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: accentColor }} /></div>
        ) : tasks.length === 0 ? (
          <div className="card p-12 text-center text-slate-400 animate-scale-in">{t('noTasks')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task, i) => (
              <button key={task.id} onClick={() => setActiveTask(task)} className="card card-hover p-5 text-left group animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge" style={{ background: `${accentColor}15`, color: accentColor }}>{task.level}</span>
                  {task.teil_number && <span className="text-xs text-slate-400">Teil {task.teil_number}</span>}
                </div>
                <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">{task.title}</h3>
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
