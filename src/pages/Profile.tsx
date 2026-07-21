import { useState } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { Level, ExamType, Lang } from '@/lib/types';
import { LEVELS, EXAM_TYPES } from '@/lib/helpers';
import Layout from '@/components/Layout';
import { User as UserIcon, Save, Check, Flame, Star, Trophy, Calendar, Settings } from 'lucide-react';

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
        .update({ full_name: fullName, target_level: targetLevel, target_exam_type: examType, exam_date: examDate || null })
        .eq('id', user.id).select().single();
      if (error) throw error;
      setProfile(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  if (!profile) return null;

  const stats = [
    { icon: Flame, value: profile.current_streak, label: t('streak'), gradient: 'from-orange-400 to-red-500', bg: 'bg-orange-50' },
    { icon: Star, value: profile.total_points, label: t('points'), gradient: 'from-sky-400 to-blue-600', bg: 'bg-sky-50' },
    { icon: Trophy, value: profile.longest_streak, label: t('longestStreak'), gradient: 'from-amber-400 to-yellow-600', bg: 'bg-amber-50' },
  ];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in max-w-3xl">
        <div className="flex items-center gap-3 animate-slide-down">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">{t('profile')}</h1>
            <p className="text-sm text-slate-500">{t('settings')}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="card card-hover p-5 text-center group relative overflow-hidden animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className={`absolute -top-8 -right-8 w-24 h-24 ${stat.bg} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />
                <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-md mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-900 relative">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-1 relative">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="card p-6 space-y-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4 text-slate-400" />
            <h3 className="font-semibold text-slate-900">{t('settings')}</h3>
          </div>
          <div>
            <label className="label">{t('fullName')}</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('level')}</label>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((lvl) => (
                <button key={lvl} onClick={() => setTargetLevel(lvl)} className={`level-pill ${targetLevel === lvl ? 'text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`} style={targetLevel === lvl ? { background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' } : {}}>{lvl}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">{t('examType')}</label>
            <div className="flex flex-wrap gap-2">
              {EXAM_TYPES.map((et) => (
                <button key={et} onClick={() => setExamType(et)} className={`level-pill ${examType === et ? 'text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`} style={examType === et ? { background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' } : {}}>{et}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">{t('examDate')}</label>
            <div className="relative group">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
              <input type="date" className="input pl-11" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">{t('language')}</label>
            <div className="flex gap-2">
              {(['uz', 'ru', 'en'] as Lang[]).map((l) => (
                <button key={l} onClick={() => setLang(l)} className={`level-pill ${lang === l ? 'text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`} style={lang === l ? { background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' } : {}}>{l.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('loading')}</> : <><Save className="w-4 h-4" />{t('save')}</>}
            </button>
            {saved && <span className="flex items-center gap-1 text-sm text-emerald-600 animate-bounce-in"><Check className="w-4 h-4" />{t('saved')}</span>}
          </div>
        </div>
      </div>
    </Layout>
  );
}
