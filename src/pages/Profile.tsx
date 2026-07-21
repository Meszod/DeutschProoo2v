import { useState } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { type Level, type ExamType } from '@/lib/types';
import { LEVELS, EXAM_TYPES } from '@/lib/helpers';
import { User as UserIcon, Save, Check, Flame, Star, Trophy, Calendar } from 'lucide-react';

export default function Profile() {
  const { t, profile, user, setProfile, setLang, lang } = useStore();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [targetLevel, setTargetLevel] = useState<Level | null>(profile?.target_level || null);
  const [examType, setExamType] = useState<ExamType>(profile?.target_exam_type || 'Goethe');
  const [examDate, setExamDate] = useState(profile?.exam_date || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          target_level: targetLevel,
          target_exam_type: examType,
          exam_date: examDate || null,
        })
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
      setProfile(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
          <UserIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{t('profile')}</h1>
          <p className="text-sm text-slate-500">{t('settings')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">{profile.current_streak}</p>
          <p className="text-xs text-slate-500">{t('streak')}</p>
        </div>
        <div className="card p-5 text-center">
          <Star className="w-6 h-6 text-sky-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">{profile.total_points}</p>
          <p className="text-xs text-slate-500">{t('points')}</p>
        </div>
        <div className="card p-5 text-center">
          <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">{profile.longest_streak}</p>
          <p className="text-xs text-slate-500">{t('longestStreak')}</p>
        </div>
      </div>

      {/* Settings form */}
      <div className="card p-6 space-y-5">
        <div>
          <label className="label">{t('fullName')}</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div>
          <label className="label">{t('level')}</label>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setTargetLevel(lvl)}
                className={`level-pill ${
                  targetLevel === lvl ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">{t('examType')}</label>
          <div className="flex flex-wrap gap-2">
            {EXAM_TYPES.map((et) => (
              <button
                key={et}
                onClick={() => setExamType(et)}
                className={`level-pill ${
                  examType === et ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {et}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">{t('examDate')}</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              className="input pl-10"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">{t('language')}</label>
          <div className="flex gap-2">
            {(['uz', 'ru', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`level-pill ${
                  lang === l ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? t('loading') : t('save')}
            <Save className="w-4 h-4" />
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-emerald-600">
              <Check className="w-4 h-4" /> {t('saved')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
