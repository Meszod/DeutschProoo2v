import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Sparkles, Layers, FileCheck, Trophy, ArrowRight } from 'lucide-react';

export default function Landing() {
  const { t } = useStore();
  const navigate = useNavigate();

  const features = [
    { icon: Sparkles, title: t('feature1'), desc: t('feature1Desc'), gradient: 'from-violet-400 to-purple-600', bg: 'bg-violet-50' },
    { icon: Layers, title: t('feature2'), desc: t('feature2Desc'), gradient: 'from-sky-400 to-blue-600', bg: 'bg-sky-50' },
    { icon: FileCheck, title: t('feature3'), desc: t('feature3Desc'), gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-50' },
    { icon: Trophy, title: t('feature4'), desc: t('feature4Desc'), gradient: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="flag-bg"><div className="flag-glow-1" /><div className="flag-glow-2" /></div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur border border-white/60 mb-6">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span className="text-sm font-medium text-slate-600">AI-powered German exam prep</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-slate-900 leading-tight mb-4">{t('heroTitle')}</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8">{t('heroSubtitle')}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => navigate('/auth')} className="btn-primary py-3 px-6 text-base">{t('getStarted')}<ArrowRight className="w-4 h-4" /></button>
            <button onClick={() => navigate('/auth')} className="btn-secondary py-3 px-6 text-base">{t('learnMore')}</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="card card-hover p-6 group relative overflow-hidden animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={`absolute -top-8 -right-8 w-24 h-24 ${f.bg} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />
                <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900 mb-1">{f.title}</h3>
                <p className="text-sm text-slate-500">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
