import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

export default function Auth() {
  const { t, setSession, setProfile } = useStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { setError(''); }, [mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: fullName } },
        });
        if (signUpError) throw signUpError;
        if (data.session) { setSession(data.session); navigate('/onboarding'); }
        else { setMode('login'); setError('Ro\'yxatdan o\'tish muvaffaqiyatli. Kiriting.'); }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        setSession(data.session);
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
        setProfile(profile);
        if (profile && !profile.target_level) navigate('/onboarding');
        else navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loginError'));
    } finally { setLoading(false); }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="flag-bg"><div className="flag-glow-1" /><div className="flag-glow-2" /></div>
      <div className="card-glass p-8 max-w-md w-full animate-scale-in relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center mx-auto mb-4 shadow-xl shadow-brand-500/30">
            <span className="font-display text-3xl font-bold">D</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">DeutschPro</h1>
          <p className="text-sm text-slate-500 mt-1">Nemis tili imtihoniga tayyorgarlik</p>
        </div>

        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6">
          <button onClick={() => setMode('login')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('login')}</button>
          <button onClick={() => setMode('signup')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('signup')}</button>
        </div>

        {error && <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-50 text-red-600 text-sm animate-slide-down"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="label">{t('fullName')}</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                <input className="input pl-11" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
            </div>
          )}
          <div>
            <label className="label">{t('email')}</label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
              <input type="email" className="input pl-11" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="label">{t('password')}</label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
              <input type={showPassword ? 'text' : 'password'} className="input pl-11 pr-11" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('loading')}</> : <>{mode === 'login' ? t('login') : t('signup')}<ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          {mode === 'login' ? t('noAccount') : t('haveAccount')}{' '}
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-brand-600 font-medium hover:underline">{mode === 'login' ? t('signup') : t('login')}</button>
        </p>
      </div>
    </div>
  );
}
