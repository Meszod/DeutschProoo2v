import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, User as UserIcon, AlertCircle, ArrowLeft, Eye, EyeOff, Sparkles, GraduationCap } from 'lucide-react';

export default function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { t, setSession, setProfile } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === 'signup';

  useEffect(() => {
    if (!isSignup) {
      const saved = localStorage.getItem('rememberMe');
      if (saved === 'true') {
        const savedEmail = localStorage.getItem('savedEmail');
        if (savedEmail) setEmail(savedEmail);
        setRememberMe(true);
      }
    }
  }, [isSignup]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        if (data.session) {
          setSession(data.session);
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .maybeSingle();
          setProfile(profile);
        }
        navigate('/onboarding');
      } else {
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('savedEmail', email);
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('savedEmail');
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          setSession(data.session);
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .maybeSingle();
          setProfile(profile);
        }
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Animated background */}
      <div className="flag-bg">
        <div className="flag-glow-1" />
        <div className="flag-glow-2" />
      </div>

      {/* Floating decorative blobs */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-brand-300/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-amber-200/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm font-medium transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {t('home')}
        </Link>

        <div className="card-glass p-8 animate-scale-in">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/30">
              <GraduationCap className="w-6 h-6" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 opacity-0 hover:opacity-100 transition-opacity blur-md" />
            </div>
            <div>
              <span className="font-display text-xl font-bold text-slate-900">DeutschPro</span>
              <p className="text-xs text-slate-500 mt-0.5">Nemis tili imtihon platformasi</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 badge bg-brand-50 text-brand-700 mb-3 px-3 py-1">
              <Sparkles className="w-3 h-3" />
              {isSignup ? t('getStarted') : t('welcome')}
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">
              {isSignup ? t('signup') : t('login')}
            </h1>
            <p className="text-sm text-slate-500">{t('tagline')}</p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 animate-slide-down">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="animate-slide-down">
                <label className="label">{t('fullName')}</label>
                <div className="relative group">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                  <input
                    className="input pl-11"
                    placeholder="Max Mustermann"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            <div>
              <label className="label">{t('email')}</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type="email"
                  className="input pl-11"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">{t('password')}</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-11 pr-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isSignup && (
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded-md border-2 border-slate-300 peer-checked:border-brand-500 peer-checked:bg-brand-500 transition-all flex items-center justify-center">
                    {rememberMe && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{t('rememberMe')}</span>
              </label>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('loading')}
                </>
              ) : isSignup ? (
                t('signup')
              ) : (
                t('login')
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200/60 text-center">
            <p className="text-sm text-slate-500">
              {isSignup ? (
                <>
                  {t('login')}?{' '}
                  <Link to="/auth/login" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                    {t('login')}
                  </Link>
                </>
              ) : (
                <>
                  {t('signup')}?{' '}
                  <Link to="/auth/signup" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                    {t('signup')}
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          DeutschPro · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
