import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import {
  LayoutDashboard,
  BookOpen,
  Headphones,
  PenLine,
  Mic,
  Layers,
  SpellCheck,
  FileCheck,
  Trophy,
  User as UserIcon,
  Shield,
  LogOut,
  Flame,
  Star,
  Menu,
  X,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'dashboard' as const },
  { to: '/lesen', icon: BookOpen, key: 'lesen' as const },
  { to: '/hoeren', icon: Headphones, key: 'hoeren' as const },
  { to: '/schreiben', icon: PenLine, key: 'schreiben' as const },
  { to: '/sprechen', icon: Mic, key: 'sprechen' as const },
  { to: '/vocabulary', icon: Layers, key: 'vocabulary' as const },
  { to: '/grammar', icon: SpellCheck, key: 'grammar' as const },
  { to: '/mock-exam', icon: FileCheck, key: 'mockExam' as const },
  { to: '/leaderboard', icon: Trophy, key: 'leaderboard' as const },
  { to: '/profile', icon: UserIcon, key: 'profile' as const },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, t, signOut } = useStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const items = isAdmin ? [...navItems, { to: '/admin', icon: Shield, key: 'admin' as const }] : navItems;

  async function handleLogout() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="relative min-h-screen flex">
      {/* Background */}
      <div className="flag-bg">
        <div className="flag-glow-1" />
        <div className="flag-glow-2" />
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-6 py-5 border-b border-slate-200/60">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-slate-900 leading-none">DeutschPro</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('tagline')}</p>
            </div>
          </NavLink>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-0.5">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                style={{ animationDelay: `${idx * 0.03}s` }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 animate-slide-down relative group ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-50 to-transparent text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-500 rounded-r-full" />
                    )}
                    <Icon className={`w-[18px] h-[18px] transition-transform group-hover:scale-110 ${isActive ? 'text-brand-600' : ''}`} />
                    <span>{t(item.key)}</span>
                    {item.to === '/admin' && (
                      <span className="ml-auto badge bg-amber-100 text-amber-700 border border-amber-200/50">Admin</span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-200/60">
          {profile && (
            <div className="flex items-center gap-2 mb-3 px-3">
              <div className="badge bg-orange-50 text-orange-600 border border-orange-100/80">
                <Flame className="w-3.5 h-3.5" /> {profile.current_streak}
              </div>
              <div className="badge bg-brand-50 text-brand-600 border border-brand-100/80">
                <Star className="w-3.5 h-3.5" /> {profile.total_points}
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="btn-ghost w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-[18px] h-[18px]" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 lg:hidden animate-fade-in" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col relative z-10">
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-4 lg:px-8 py-3 flex items-center justify-between">
          <button
            className="lg:hidden btn-ghost px-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="hidden lg:flex items-center gap-2">
            {profile?.target_level && (
              <span className="text-sm text-slate-500">
                {t('level')}: <span className="font-semibold text-slate-800">{profile.target_level}</span>
                {profile.target_exam_type && (
                  <>
                    <span className="text-slate-300 mx-1.5">·</span>
                    <span className="font-semibold text-slate-800">{profile.target_exam_type}</span>
                  </>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {profile?.exam_date && (
              <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-100/80">
                <Sparkles className="w-3 h-3" />
                {Math.max(0, Math.ceil((new Date(profile.exam_date).getTime() - Date.now()) / 86400000))} {t('daysLeft')}
              </span>
            )}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-sm font-semibold shadow-md">
              {(profile?.full_name || '?').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
