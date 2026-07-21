import { Link } from 'react-router-dom';
import { useStore } from '@/lib/store';
import {
  BookOpen,
  Headphones,
  PenLine,
  Mic,
  Layers,
  Trophy,
  FileCheck,
  Sparkles,
  ArrowRight,
  Check,
  GraduationCap,
  Star,
  Zap,
  Globe,
} from 'lucide-react';

export default function Landing() {
  const { t, setLang, lang } = useStore();

  const features = [
    { icon: BookOpen, title: t('lesen'), desc: 'Goethe/telc formatidagi original matnlar', color: 'from-sky-500 to-blue-600', bg: 'bg-sky-50' },
    { icon: Headphones, title: t('hoeren'), desc: 'Brauzer TTS orqali nemischa audio', color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50' },
    { icon: PenLine, title: t('schreiben'), desc: 'AI 4 mezon bo\'yicha baholaydi', color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50' },
    { icon: Mic, title: t('sprechen'), desc: 'Mikrofon orqali yozish va Whisper transkripsiya', color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50' },
    { icon: Layers, title: t('vocabulary'), desc: 'SM-2 spaced repetition algoritmi', color: 'from-rose-500 to-pink-600', bg: 'bg-rose-50' },
    { icon: Trophy, title: t('leaderboard'), desc: 'Streak, badge va haftalik reyting', color: 'from-yellow-500 to-amber-600', bg: 'bg-amber-50' },
    { icon: FileCheck, title: t('mockExam'), desc: 'To\'liq imtihon simulyatsiyasi', color: 'from-indigo-500 to-blue-600', bg: 'bg-indigo-50' },
    { icon: Sparkles, title: t('placementTest'), desc: 'Darajani aniqlash testi', color: 'from-cyan-500 to-sky-600', bg: 'bg-cyan-50' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated background */}
      <div className="flag-bg">
        <div className="flag-glow-1" />
        <div className="flag-glow-2" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-display text-xl font-bold text-slate-900">DeutschPro</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100/80 rounded-lg p-0.5">
              {(['uz', 'ru', 'en'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    lang === l ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <Link to="/auth/login" className="btn-ghost text-sm">
              {t('login')}
            </Link>
            <Link to="/auth/signup" className="btn-primary text-sm">
              {t('getStarted')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative">
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-300/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 left-10 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-28 text-center">
          <div className="inline-flex items-center gap-2 badge bg-brand-50 text-brand-700 mb-6 px-4 py-1.5 animate-bounce-in border border-brand-200/50">
            <Sparkles className="w-4 h-4" />
            A1 · A2 · B1 · B2 · C1
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-slate-900 leading-tight max-w-3xl mx-auto animate-slide-up">
            {t('heroTitle')}
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {t('heroSubtitle')}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/auth/signup" className="btn-primary text-base px-8 py-3.5">
              {t('getStarted')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/auth/login" className="btn-secondary text-base px-8 py-3.5">
              {t('login')}
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {['Goethe', 'telc', 'OSD', 'A1-C1'].map((badge, i) => (
              <div key={badge} className="card card-hover p-4 flex items-center justify-center gap-2 animate-scale-in" style={{ animationDelay: `${0.4 + i * 0.1}s` }}>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-slate-700">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="relative max-w-6xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Zap, value: '10K+', label: 'Topshiriq' },
            { icon: Star, value: '4.9', label: 'Reyting' },
            { icon: Globe, value: '3', label: 'Til' },
            { icon: GraduationCap, value: 'A1-C1', label: 'Daraja' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="card card-hover p-5 text-center animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <Icon className="w-6 h-6 mx-auto mb-2 text-brand-500" />
                <div className="font-display text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold text-slate-900 mb-3">{t('modules')}</h2>
          <p className="text-slate-500 max-w-xl mx-auto">{t('tagline')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="card card-hover p-6 animate-slide-up group cursor-default"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1.5 group-hover:text-brand-600 transition-colors">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 px-8 py-16 text-center animate-gradient">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-glow" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-300/10 rounded-full blur-3xl animate-glow" style={{ animationDelay: '1.5s' }} />
          <h2 className="relative font-display text-3xl font-bold text-white mb-3">{t('ctaTitle')}</h2>
          <p className="relative text-brand-100 mb-8 max-w-md mx-auto">{t('ctaSubtitle')}</p>
          <Link
            to="/auth/signup"
            className="relative inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-brand-50 transition-all hover:scale-105 active:scale-95 shadow-xl"
          >
            {t('getStarted')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200/60 py-8 text-center text-sm text-slate-400">
        DeutschPro · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
