import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { Task, Level, MockExam } from '@/lib/types';
import { LEVELS, TIME_LIMITS, formatTime } from '@/lib/helpers';
import TaskRunner from '@/components/TaskRunner';
import { FileCheck, ArrowLeft, Clock, Check, X, Trophy, RotateCcw } from 'lucide-react';

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
      const { data } = await supabase
        .from('mock_exams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setHistory(data || []);
    })();
  }, [user]);

  async function startExam() {
    if (!level) return;
    setLoading(true);
    const skills = ['lesen', 'hoeren', 'schreiben', 'sprechen'];
    const newTasks: Record<string, Task | null> = {};
    for (const skill of skills) {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('skill', skill)
        .eq('level', level)
        .limit(1)
        .maybeSingle();
      newTasks[skill] = data;
    }
    setTasks(newTasks);
    setScores({});
    setLoading(false);
    setPhase('lesen');
  }

  function handlePartComplete(scorePct: number) {
    setScores((prev) => ({ ...prev, [phase]: scorePct }));
  }

  function nextPart() {
    const order: Phase[] = ['lesen', 'hoeren', 'schreiben', 'sprechen', 'result'];
    const currentIdx = order.indexOf(phase);
    if (currentIdx < order.length - 1) {
      setPhase(order[currentIdx + 1]);
    }
  }

  async function finishExam() {
    const total = Object.values(scores).reduce((a, b) => a + b, 0) / 4;
    const passed = total >= 60;
    if (user && level) {
      await supabase.from('mock_exams').insert({
        user_id: user.id,
        level,
        exam_type: profile?.target_exam_type || 'Goethe',
        lesen_score: scores.lesen || 0,
        hoeren_score: scores.hoeren || 0,
        schreiben_score: scores.schreiben || 0,
        sprechen_score: scores.sprechen || 0,
        total_score: total,
        passed,
      });
      await supabase.rpc('record_activity', { p_points: Math.round(total) });
      // refresh history
      const { data } = await supabase
        .from('mock_exams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setHistory(data || []);
    }
    setPhase('result');
  }

  // Render result
  if (phase === 'result') {
    const total = Object.values(scores).reduce((a, b) => a + b, 0) / 4;
    const passed = total >= 60;
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="card p-8 text-center">
          <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-4 ${
            passed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
          }`}>
            {passed ? <Trophy className="w-10 h-10" /> : <X className="w-10 h-10" />}
          </div>
          <h2 className={`text-3xl font-bold ${passed ? 'text-emerald-600' : 'text-red-500'}`}>
            {passed ? t('passed') : t('failed')}
          </h2>
          <p className="text-4xl font-bold text-slate-900 mt-4">{Math.round(total)}%</p>
          <p className="text-slate-500 mt-1">{t('finalResult')} · {level}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['lesen', 'hoeren', 'schreiben', 'sprechen'] as const).map((skill) => (
            <div key={skill} className="card p-4 text-center">
              <p className="text-sm text-slate-500 capitalize mb-1">{t(skill)}</p>
              <p className="text-2xl font-bold text-slate-900">{scores[skill] || 0}%</p>
            </div>
          ))}
        </div>

        <button onClick={() => setPhase('intro')} className="btn-secondary w-full">
          <RotateCcw className="w-4 h-4" />
          {t('start')}
        </button>

        {history.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">{t('history')}</h3>
            <div className="space-y-2">
              {history.map((exam) => (
                <div key={exam.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-900">{exam.level}</span>
                    <span className="text-sm text-slate-400 ml-2">
                      {new Date(exam.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900">{Math.round(Number(exam.total_score))}%</span>
                    {exam.passed ? (
                      <Check className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render active part
  if (phase !== 'intro') {
    const task = tasks[phase];
    const skillMode = phase === 'lesen' || phase === 'hoeren' ? (phase as 'lesen' | 'hoeren') : null;
    const partLabels: Record<string, string> = {
      lesen: t('lesenPart'),
      hoeren: t('hoerenPart'),
      schreiben: t('schreibenPart'),
      sprechen: t('sprechenPart'),
    };

    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button onClick={() => setPhase('intro')} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-4 h-4" /> {t('back')}
          </button>
          <div className="flex items-center gap-2">
            <span className="badge bg-sky-50 text-sky-600">{level}</span>
            <span className="badge bg-slate-100 text-slate-600">{partLabels[phase]}</span>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {(['lesen', 'hoeren', 'schreiben', 'sprechen'] as const).map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                scores[s] !== undefined ? 'bg-emerald-500' : s === phase ? 'bg-sky-500' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {task && skillMode ? (
          <>
            <TaskRunner task={task} mode={skillMode} isMock onComplete={handlePartComplete} />
            {scores[phase] !== undefined && (
              <div className="card p-6 text-center">
                <p className="text-sm text-slate-500">{t('score')}: <span className="font-bold text-slate-900">{scores[phase]}%</span></p>
                <button onClick={nextPart} className="btn-primary mt-4">
                  {phase === 'sprechen' ? t('finish') : t('nextPart')}
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              </div>
            )}
          </>
        ) : task && (phase === 'schreiben' || phase === 'sprechen') ? (
          <MockWritingPart
            task={task}
            mode={phase}
            onComplete={handlePartComplete}
            onNext={() => (phase === 'sprechen' ? finishExam() : nextPart())}
            isLast={phase === 'sprechen'}
          />
        ) : (
          <div className="card p-12 text-center text-slate-400">
            {t('noTasks')} ({phase})
            <button onClick={nextPart} className="btn-secondary mt-4">{t('nextPart')}</button>
          </div>
        )}
      </div>
    );
  }

  // Intro
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <FileCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{t('mockExam')}</h1>
          <p className="text-sm text-slate-500">{t('mockExamIntro')}</p>
        </div>
      </div>

      <div className="card p-6">
        <label className="label">{t('level')}</label>
        <div className="flex flex-wrap gap-2 mb-6">
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevel(lvl)}
              className={`level-pill ${
                level === lvl ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="space-y-2 mb-6">
          {(['lesen', 'hoeren', 'schreiben', 'sprechen'] as const).map((skill) => (
            <div key={skill} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{t(skill)}</span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                {level && TIME_LIMITS[level]?.[skill] || 0} {t('minutes')}
              </span>
            </div>
          ))}
        </div>

        <button onClick={startExam} disabled={loading || !level} className="btn-primary w-full">
          {loading ? t('loading') : t('startMock')}
        </button>
      </div>

      {history.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-900 mb-3">{t('history')}</h3>
          <div className="space-y-2">
            {history.map((exam) => (
              <div key={exam.id} className="card p-4 flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-900">{exam.level}</span>
                  <span className="text-sm text-slate-400 ml-2">
                    {new Date(exam.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900">{Math.round(Number(exam.total_score))}%</span>
                  {exam.passed ? <Check className="w-5 h-5 text-emerald-500" /> : <X className="w-5 h-5 text-red-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MockWritingPart({
  task,
  mode,
  onComplete,
  onNext,
  isLast,
}: {
  task: Task;
  mode: 'schreiben' | 'sprechen';
  onComplete: (score: number) => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const { t } = useStore();
  const [text, setText] = useState('');
  const [score, setScore] = useState<number | null>(null);

  function submit() {
    // Simple scoring for mock mode
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minW = task.content.min_words || 30;
    const pct = Math.min(100, Math.round((words / minW) * 60 + 20));
    setScore(pct);
    onComplete(pct);
  }

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <p className="text-slate-700 leading-relaxed mb-4">{task.content.prompt}</p>
        {task.content.leitpunkte && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">{t('leitpunkte')}:</p>
            <ul className="space-y-1">
              {task.content.leitpunkte.map((lp, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-sky-500 font-bold">•</span>
                  {lp}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {mode === 'schreiben' ? (
        <textarea
          className="input min-h-[200px] resize-y"
          placeholder={t('writeHere')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={score !== null}
        />
      ) : (
        <div className="card p-6 text-center text-slate-500">
          <p className="text-sm">{t('sprechen')} — {t('record')}</p>
          <textarea
            className="input mt-4 min-h-[100px]"
            placeholder="Sizning javobingiz matnini shu yerga kiriting (mock rejim)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={score !== null}
          />
        </div>
      )}

      {score !== null ? (
        <div className="card p-6 text-center">
          <p className="text-sm text-slate-500">{t('score')}: <span className="font-bold text-slate-900">{score}%</span></p>
          <button onClick={onNext} className="btn-primary mt-4">
            {isLast ? t('finish') : t('nextPart')}
          </button>
        </div>
      ) : (
        <button onClick={submit} disabled={text.trim().length < 10} className="btn-primary w-full">
          {t('submit')}
        </button>
      )}
    </div>
  );
}
