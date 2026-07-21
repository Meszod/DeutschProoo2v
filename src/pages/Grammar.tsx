import { useState } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { SpellCheck, Check, X, ArrowRight, RotateCcw } from 'lucide-react';

interface GrammarExercise {
  type: 'article' | 'case' | 'tense' | 'fill_blank';
  question: string;
  options?: string[];
  answer: number;
  explanation: string;
}

const EXERCISES: GrammarExercise[] = [
  { type: 'article', question: '___ Tisch ist neu.', options: ['Der', 'Die', 'Das', 'Den'], answer: 0, explanation: 'Tisch — erkak, artikl: der.' },
  { type: 'article', question: '___ Blume ist schön.', options: ['Der', 'Die', 'Das', 'Den'], answer: 1, explanation: 'Blume — ayol, artikl: die.' },
  { type: 'article', question: '___ Kind spielt.', options: ['Der', 'Die', 'Das', 'Den'], answer: 2, explanation: 'Kind — neytral, artikl: das.' },
  { type: 'case', question: 'Ich sehe ___ Mann.', options: ['der', 'den', 'dem', 'des'], answer: 1, explanation: 'Akkusativ: der → den.' },
  { type: 'case', question: 'Ich gebe ___ Lehrer das Buch.', options: ['der', 'den', 'dem', 'des'], answer: 2, explanation: 'Dativ: der → dem.' },
  { type: 'case', question: 'Das Auto ___ Mannes ist rot.', options: ['der', 'den', 'dem', 'des'], answer: 3, explanation: 'Genitiv: der → des.' },
  { type: 'tense', question: 'Ich ___ gestern ins Kino (gehen).', options: ['gehe', 'ging', 'gegangen', 'gehen'], answer: 1, explanation: 'Präteritum: gehen → ging.' },
  { type: 'tense', question: 'Wir haben das Buch ___. (lesen)', options: ['gelesen', 'lasen', 'liest', 'gelesen haben'], answer: 0, explanation: 'Perfekt: gelesen.' },
  { type: 'tense', question: 'Morgen ___ ich dich. (besuchen)', options: ['besuche', 'besuchte', 'besucht', 'werde besuchen'], answer: 0, explanation: 'Präsens: ich besuche.' },
  { type: 'fill_blank', question: 'Ich lerne Deutsch, ___ ich in Deutschland arbeiten möchte.', options: ['und', 'weil', 'aber', 'oder'], answer: 1, explanation: 'Sabab: weil.' },
  { type: 'fill_blank', question: '___ es regnet, bleibe ich zu Hause.', options: ['Weil', 'Wenn', 'Als', 'Damit'], answer: 1, explanation: 'Shart: wenn.' },
  { type: 'fill_blank', question: 'Er ist reich, ___ er nicht glücklich ist.', options: ['und', 'weil', 'aber', 'dass'], answer: 2, explanation: 'Qarshi: aber.' },
];

export default function Grammar() {
  const { t, user } = useStore();
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const ex = EXERCISES[idx];

  function check() {
    if (selected === null) return;
    setChecked(true);
    if (selected === ex.answer) setCorrectCount((c) => c + 1);
  }

  function next() {
    if (idx < EXERCISES.length - 1) {
      setIdx(idx + 1);
      setSelected(null);
      setChecked(false);
    } else {
      setFinished(true);
      if (user) {
        supabase.rpc('record_activity', { p_points: correctCount * 3 }).then(() => {});
      }
    }
  }

  function restart() {
    setIdx(0);
    setSelected(null);
    setChecked(false);
    setCorrectCount(0);
    setFinished(false);
  }

  if (finished) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="card p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <SpellCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{correctCount} / {EXERCISES.length}</h2>
          <p className="text-slate-500 mt-1">{t('score')}</p>
          <button onClick={restart} className="btn-primary mt-6">
            <RotateCcw className="w-4 h-4" />
            {t('start')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
          <SpellCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{t('grammar')}</h1>
          <p className="text-sm text-slate-500">{t('grammarExercise')}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">
          {t('question')} {idx + 1} {t('of')} {EXERCISES.length}
        </span>
        <span className="badge bg-slate-100 text-slate-600 capitalize">{ex.type.replace('_', ' ')}</span>
      </div>

      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-500 rounded-full transition-all"
          style={{ width: `${((idx + 1) / EXERCISES.length) * 100}%` }}
        />
      </div>

      <div className="card p-6">
        <p className="text-lg font-medium text-slate-900 mb-6">{ex.question}</p>
        <div className="space-y-2.5">
          {ex.options?.map((opt, i) => {
            let style = 'border-slate-200 hover:border-slate-300 text-slate-700';
            if (checked) {
              if (i === ex.answer) style = 'border-emerald-500 bg-emerald-50 text-emerald-700';
              else if (i === selected) style = 'border-red-500 bg-red-50 text-red-600';
              else style = 'border-slate-200 text-slate-400';
            } else if (selected === i) {
              style = 'border-teal-500 bg-teal-50 text-teal-700';
            }
            return (
              <button
                key={i}
                disabled={checked}
                onClick={() => setSelected(i)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm font-medium ${style}`}
              >
                <span className="flex items-center justify-between">
                  {opt}
                  {checked && i === ex.answer && <Check className="w-4 h-4" />}
                  {checked && i === selected && i !== ex.answer && <X className="w-4 h-4" />}
                </span>
              </button>
            );
          })}
        </div>

        {checked && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-sm text-slate-600">
              <span className="font-semibold">{t('explanation')}: </span>
              {ex.explanation}
            </p>
          </div>
        )}

        <div className="mt-5">
          {!checked ? (
            <button onClick={check} disabled={selected === null} className="btn-primary w-full">
              {t('check')}
            </button>
          ) : (
            <button onClick={next} className="btn-primary w-full">
              {idx < EXERCISES.length - 1 ? t('next') : t('finish')}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
