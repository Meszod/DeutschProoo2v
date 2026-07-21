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
} from 'lucide-react';

export default function Landing() {
  const { t, setLang, lang } = useStore();

  const features = [
    { icon: BookOpen, title: t('lesen'), desc: 'Goethe/telc formatidagi original matnlar' },
    { icon: Headphones, title: t('hoeren'), desc: 'Brauzer TTS orqali nemischa audio' },
    { icon: PenLine, title: t('schreiben'), desc: 'AI 4 mezon bo\'yicha baholaydi' },
    { icon: Mic, title: t('sprechen'), desc: 'Mikrofon orqali yozish va Whisper transkripsiya' },
    { icon: Layers, title: t('vocabulary'), desc: 'SM-2 spaced repetition algoritmi' },
    { icon: Trophy, title: t('leaderboard'), desc: 'Streak, badge va haftalik reyting' },
    { icon: FileCheck, title: t('mockExam'), desc: 'To\'liq imtihon simulyatsiyasi' },
    { icon: Sparkles, title: t('placementTest'), desc: 'Darajani aniqlash testi' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white font-bold text-lg">
              D
            </div>
            <span className="font-display text-xl font-bold text-slate-900">DeutschPro</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
              {(['uz', 'ru', 'en'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                    lang === l ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50 via-slate-50 to-slate-50" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-sky-200/30 rounded-full blur-3xl" />
        <div className="absolute top-40 left-10 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 badge bg-sky-100 text-sky-700 mb-6 px-4 py-1.5">
            <Sparkles className="w-4 h-4" />
            A1 · A2 · B1 · B2 · C1
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-slate-900 leading-tight max-w-3xl mx-auto">
            {t('heroTitle')}
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">{t('heroSubtitle')}</p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/signup" className="btn-primary text-base px-8 py-3.5">
              {t('getStarted')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/auth/login" className="btn-secondary text-base px-8 py-3.5">
              {t('login')}
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {['Goethe', 'telc', 'OSD', 'A1-C1'].map((badge) => (
              <div key={badge} className="card px-4 py-3 flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-slate-700">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl font-bold text-slate-900 text-center mb-4">{t('modules')}</h2>
        <p className="text-slate-500 text-center mb-12 max-w-xl mx-auto">{t('tagline')}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="card p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 to-sky-800 px-8 py-16 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <h2 className="relative font-display text-3xl font-bold text-white mb-3">{t('ctaTitle')}</h2>
          <p className="relative text-sky-100 mb-8 max-w-md mx-auto">{t('ctaSubtitle')}</p>
          <Link
            to="/auth/signup"
            className="relative inline-flex items-center gap-2 bg-white text-sky-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-sky-50 transition"
          >
            {t('getStarted')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        DeutschPro · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
