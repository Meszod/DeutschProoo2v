import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import {
  LayoutDashboard, BookOpen, Headphones, PenLine, Mic,
  Layers, SpellCheck, FileCheck, Trophy, User as UserIcon,
  LogOut, Flame, Star, Menu, X, Shield,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { to: '/lesen', icon: BookOpen, key: 'lesen' },
  { to: '/hoeren', icon: Headphones, key: 'hoeren' },
  { to: '/schreiben', icon: PenLine, key: 'schreiben' },
  { to: '/sprechen', icon: Mic, key: 'sprechen' },
  { to: '/vocabulary', icon: Layers, key: 'vocabulary' },
  { to: '/grammar', icon: SpellCheck, key: 'grammar' },
  { to: '/mock-exam', icon: FileCheck, key: 'mockExam' },
  { to: '/leaderboard', icon: Trophy, key: 'leaderboard' },
  { to: '/profile', icon: UserIcon, key: 'profile' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { t, profile, signOut, user } = useStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = profile?.role === 'admin';

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  const allItems = isAdmin ? [...navItems, { to: '/admin', icon: Shield, key: 'admin' }] : navItems;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 bg-white/80 backdrop-blur-xl border-r border-slate-200/80 z-30">
        <div className="p-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md shadow-brand-500/30">
              <span className="text-white font-bold text-lg font-display">D</span>
            </div>
            <span className="font-display text-xl font-bold text-slate-900">DeutschPro</span>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-thin">
          {allItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/25'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{t(item.key)}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-200/80">
          {profile && (
            <div className="flex items-center gap-2 mb-3 px-2">
              <div className="flex items-center gap-1.5 text-xs">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="font-semibold text-slate-700">{profile.current_streak}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-slate-700">{profile.total_points}</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-semibold text-slate-600">
              {(profile?.full_name || user?.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{profile?.full_name || 'Foydalanuvchi'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
            <LogOut className="w-4 h-4" /> {t('logout')}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <span className="text-white font-bold font-display">D</span>
            </div>
            <span className="font-display text-lg font-bold">DeutschPro</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-slate-100">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-black/20" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-16 inset-x-0 bg-white border-b border-slate-200 shadow-lg animate-slide-down" onClick={(e) => e.stopPropagation()}>
            <nav className="p-3 space-y-1">
              {allItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" /> {t(item.key)}
                  </NavLink>
                );
              })}
              <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50">
                <LogOut className="w-5 h-5" /> {t('logout')}
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
