import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { Task, Level, MockExam } from '@/lib/types';
import { LEVELS, TIME_LIMITS } from '@/lib/helpers';
import Layout from '@/components/Layout';
import TaskRunner from '@/components/TaskRunner';
import { FileCheck, ArrowLeft, Clock, Check, X, Trophy, RotateCcw, ArrowRight } from 'lucide-react';

const ACCENT = '#6366f1';
type Phase = 'intro' | 'lesen' | 'hoeren' | 'schreiben' | 'sprechen' | 'result';

export default function MockExam() {
  const { t, profile, user } = useStore();
  const [phase, setPhase] = useState<Phase>('intro');
  const [level, setLevel] = useState<Level | null>(profile?.target_level || 'B1');
  const [tasks, setTasks] = useState<Record<string, Task | null>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<MockExam[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('mock_exams').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
      setHistory(data || []);
    })();
  }, [user]);

  async function startExam() {
    if (!level) return;
    setLoading(true);
    const skills = ['lesen', 'hoeren', 'schreiben', 'sprechen'];
    const newTasks: Record<string, Task | null> = {};
    for (const skill of skills) {
      const { data } = await supabase.from('tasks').select('*').eq('skill', skill).eq('level', level).limit(1).maybeSingle();
      newTasks[skill] = data;
    }
    setTasks(newTasks); setScores({}); setLoading(false); setPhase('lesen');
  }

  function handlePartComplete(scorePct: number) { setScores((prev) => ({ ...prev, [phase]: scorePct })); }
  function nextPart() {
    const order: Phase[] = ['lesen', 'hoeren', 'schreiben', 'sprechen', 'result'];
    const idx = order.indexOf(phase);
    if (idx < order.length - 1) setPhase(order[idx + 1]);
  }

  async function finishExam() {
    const total = Object.values(scores).reduce((a, b) => a + b, 0) / 4;
    const passed = total >= 60;
    if (user && level) {
      await supabase.from('mock_exams').insert({ user_id: user.id, level, exam_type: profile?.target_exam_type || 'Goethe', lesen_score: scores.lesen || 0, hoeren_score: scores.hoeren || 0, schreiben_score: scores.schreiben || 0, sprechen_score: scores.sprechen || 0, total_score: total, passed });
      await supabase.rpc('record_activity', { p_points: Math.round(total) });
      const { data } = await supabase.from('mock_exams').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
      setHistory(data || []);
    }
    setPhase('result');
  }

  if (phase === 'result') {
    const total = Object.values(scores).reduce((a, b) => a + b, 0) / 4;
    const passed = total >= 60;
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <div className="card p-8 text-center relative overflow-hidden animate-scale-in">
            <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-3xl opacity-30 ${passed ? 'bg-emerald-300' : 'bg-red-300'}`} />
            <div className={`relative w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-4 ${passed ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-gradient-to-br from-red-400 to-rose-500 text-white shadow-lg shadow-red-500/30'}`}>
              {passed ? <Trophy className="w-10 h-10" /> : <X className="w-10 h-10" />}
            </div>
            <h2 className={`text-2xl font-bold ${passed ? 'text-emerald-600' : 'text-red-500'}`}>{passed ? t('passed') : t('failed')}</h2>
            <p className="text-4xl font-bold text-slate-900 mt-4">{Math.round(total)}%</p>
            <p className="text-slate-500 mt-1">{t('finalResult')} · {level}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['lesen', 'hoeren', 'schreiben', 'sprechen'] as const).map((skill, i) => (
              <div key={skill} className="card card-hover p-5 text-center group animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <p className="text-sm text-slate-500 capitalize mb-2">{t(skill)}</p>
                <p className="text-3xl font-bold text-slate-900 group-hover:scale-110 transition-transform">{scores[skill] || 0}%</p>
              </div>
            ))}
          </div>
          <button onClick={() => setPhase('intro')} className="btn-secondary w-full"><RotateCcw className="w-4 h-4" /> {t('start')}</button>
          {history.length > 0 && (
            <div className="animate-slide-up">
              <h3 className="font-semibold text-slate-900 mb-3">{t('history')}</h3>
              <div className="space-y-2">
                {history.map((exam, i) => (
                  <div key={exam.id} className="card card-hover p-4 flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 0.03}s` }}>
                    <div><span className="font-medium text-slate-900">{exam.level}</span><span className="text-sm text-slate-400 ml-2">{new Date(exam.created_at).toLocaleDateString()}</span></div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-900">{Math.round(Number(exam.total_score))}%</span>
                      {exam.passed ? <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center"><Check className="w-4 h-4 text-emerald-600" /></div> : <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center"><X className="w-4 h-4 text-red-400" /></div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  if (phase !== 'intro') {
    const task = tasks[phase];
    const skillMode = phase === 'lesen' || phase === 'hoeren' ? (phase as 'lesen' | 'hoeren') : null;
    const partLabels: Record<string, string> = { lesen: t('lesenPart'), hoeren: t('hoerenPart'), schreiben: t('schreibenPart'), sprechen: t('sprechenPart') };
    return (
      <Layout>
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-3 animate-slide-down">
            <button onClick={() => setPhase('intro')} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 group transition-colors"><ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {t('back')}</button>
            <div className="flex items-center gap-2"><span className="badge" style={{ background: `${ACCENT}15`, color: ACCENT }}>{level}</span><span className="badge bg-slate-100 text-slate-600">{partLabels[phase]}</span></div>
          </div>
          <div className="flex items-center gap-2">
            {(['lesen', 'hoeren', 'schreiben', 'sprechen'] as const).map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${scores[s] !== undefined ? 'bg-emerald-500' : s === phase ? 'bg-indigo-500' : 'bg-slate-200'}`} />
            ))}
          </div>
          {task && skillMode ? (
            <>
              <TaskRunner task={task} mode={skillMode} isMock onComplete={handlePartComplete} />
              {scores[phase] !== undefined && (
                <div className="card p-6 text-center animate-scale-in">
                  <p className="text-sm text-slate-500">{t('score')}: <span className="font-bold text-slate-900">{scores[phase]}%</span></p>
                  <button onClick={nextPart} className="btn-primary mt-4">{phase === 'sprechen' ? t('finish') : t('nextPart')} <ArrowRight className="w-4 h-4" /></button>
                </div>
              )}
            </>
          ) : task && (phase === 'schreiben' || phase === 'sprechen') ? (
            <MockWritingPart task={task} mode={phase} onComplete={handlePartComplete} onNext={() => (phase === 'sprechen' ? finishExam() : nextPart())} isLast={phase === 'sprechen'} />
          ) : (
            <div className="card p-12 text-center text-slate-400 animate-scale-in">{t('noTasks')} ({phase})<button onClick={nextPart} className="btn-secondary mt-4">{t('nextPart')}</button></div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3 animate-slide-down">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `${ACCENT}15`, color: ACCENT, boxShadow: `0 4px 14px ${ACCENT}25` }}>
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">{t('mockExam')}</h1>
            <p className="text-sm text-slate-500">{t('mockExamIntro')}</p>
          </div>
        </div>
        <div className="card p-6 animate-slide-up">
          <label className="label">{t('level')}</label>
          <div className="flex flex-wrap gap-2 mb-6">
            {LEVELS.map((lvl) => (
              <button key={lvl} onClick={() => setLevel(lvl)} className={`level-pill ${level === lvl ? 'text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`} style={level === lvl ? { background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}dd)` } : {}}>{lvl}</button>
            ))}
          </div>
          <div className="space-y-2 mb-6">
            {(['lesen', 'hoeren', 'schreiben', 'sprechen'] as const).map((skill, i) => (
              <div key={skill} className="flex items-center justify-between text-sm p-2.5 rounded-lg hover:bg-slate-50 transition-colors animate-slide-down" style={{ animationDelay: `${i * 0.05}s` }}>
                <span className="text-slate-600 capitalize">{t(skill)}</span>
                <span className="flex items-center gap-1.5 text-slate-400"><Clock className="w-3.5 h-3.5" />{level && TIME_LIMITS[level]?.[skill] || 0} {t('minutes')}</span>
              </div>
            ))}
          </div>
          <button onClick={startExam} disabled={loading || !level} className="btn-primary w-full py-3 text-base">
            {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('loading')}</> : <>{t('startMock')}<ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
        {history.length > 0 && (
          <div className="animate-slide-up">
            <h3 className="font-semibold text-slate-900 mb-3">{t('history')}</h3>
            <div className="space-y-2">
              {history.map((exam, i) => (
                <div key={exam.id} className="card card-hover p-4 flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 0.03}s` }}>
                  <div><span className="font-medium text-slate-900">{exam.level}</span><span className="text-sm text-slate-400 ml-2">{new Date(exam.created_at).toLocaleDateString()}</span></div>
                  <div className="flex items-center gap-3"><span className="text-sm font-semibold text-slate-900">{Math.round(Number(exam.total_score))}%</span>{exam.passed ? <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center"><Check className="w-4 h-4 text-emerald-600" /></div> : <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center"><X className="w-4 h-4 text-red-400" /></div>}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function MockWritingPart({ task, mode, onComplete, onNext, isLast }: { task: Task; mode: 'schreiben' | 'sprechen'; onComplete: (score: number) => void; onNext: () => void; isLast: boolean; }) {
  const { t } = useStore();
  const [text, setText] = useState('');
  const [score, setScore] = useState<number | null>(null);
  function submit() {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minW = task.content.min_words || 30;
    const pct = Math.min(100, Math.round((words / minW) * 60 + 20));
    setScore(pct); onComplete(pct);
  }
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card p-6 animate-slide-up">
        <p className="text-slate-700 leading-relaxed mb-4">{task.content.prompt}</p>
        {task.content.leitpunkte && (
          <div><p className="text-sm font-semibold text-slate-700 mb-2">{t('leitpunkte')}:</p>
            <ul className="space-y-1.5">{task.content.leitpunkte.map((lp, i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-600 animate-slide-down" style={{ animationDelay: `${i * 0.05}s` }}><span className="font-bold text-indigo-500">•</span>{lp}</li>)}</ul>
          </div>
        )}
      </div>
      {mode === 'schreiben' ? (
        <textarea className="input min-h-[200px] resize-y leading-relaxed" placeholder={t('writeHere')} value={text} onChange={(e) => setText(e.target.value)} disabled={score !== null} />
      ) : (
        <div className="card p-6 text-center text-slate-500"><p className="text-sm">{t('sprechen')} — {t('record')}</p><textarea className="input mt-4 min-h-[100px]" placeholder="Sizning javobingiz matnini shu yerga kiriting (mock rejim)..." value={text} onChange={(e) => setText(e.target.value)} disabled={score !== null} /></div>
      )}
      {score !== null ? (
        <div className="card p-6 text-center animate-scale-in">
          <p className="text-sm text-slate-500">{t('score')}: <span className="font-bold text-slate-900">{score}%</span></p>
          <button onClick={onNext} className="btn-primary mt-4">{isLast ? t('finish') : t('nextPart')} <ArrowRight className="w-4 h-4" /></button>
        </div>
      ) : (
        <button onClick={submit} disabled={text.trim().length < 10} className="btn-primary w-full">{t('submit')}</button>
      )}
    </div>
  );
}
