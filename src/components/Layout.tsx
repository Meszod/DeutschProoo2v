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
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white font-bold text-lg">
              D
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-slate-900 leading-none">DeutschPro</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Imtihon platformasi</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sky-50 text-sky-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-[18px] h-[18px]" />
                <span>{t(item.key)}</span>
                {item.to === '/admin' && (
                  <span className="ml-auto badge bg-amber-100 text-amber-700">Admin</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-100">
          {profile && (
            <div className="flex items-center gap-2 mb-3 px-3">
              <div className="badge bg-orange-50 text-orange-600">
                <Flame className="w-3.5 h-3.5" /> {profile.current_streak}
              </div>
              <div className="badge bg-sky-50 text-sky-600">
                <Star className="w-3.5 h-3.5" /> {profile.total_points}
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="btn-ghost w-full justify-start text-slate-500">
            <LogOut className="w-[18px] h-[18px]" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3 flex items-center justify-between">
          <button
            className="lg:hidden btn-ghost px-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="hidden lg:block">
            {profile?.target_level && (
              <span className="text-sm text-slate-500">
                {t('level')}: <span className="font-semibold text-slate-800">{profile.target_level}</span>
                {profile.target_exam_type && (
                  <>
                    {' · '}
                    <span className="font-semibold text-slate-800">{profile.target_exam_type}</span>
                  </>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {profile?.exam_date && (
              <span className="badge bg-emerald-50 text-emerald-700">
                {Math.max(0, Math.ceil((new Date(profile.exam_date).getTime() - Date.now()) / 86400000))} {t('daysLeft')}
              </span>
            )}
            <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-semibold">
              {(profile?.full_name || '?').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
