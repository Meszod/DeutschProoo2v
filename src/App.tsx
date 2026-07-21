import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import Auth from '@/pages/Auth';
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import Lesen from '@/pages/Lesen';
import Hoeren from '@/pages/Hoeren';
import Schreiben from '@/pages/Schreiben';
import Sprechen from '@/pages/Sprechen';
import Vocabulary from '@/pages/Vocabulary';
import Grammar from '@/pages/Grammar';
import MockExam from '@/pages/MockExam';
import Leaderboard from '@/pages/Leaderboard';
import Profile from '@/pages/Profile';
import Onboarding from '@/pages/Onboarding';
import Admin from '@/pages/Admin';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useStore();
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { setSession, setProfile, session } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session);
        supabase.from('profiles').select('*').eq('id', data.session.user.id).maybeSingle().then(({ data: p }) => setProfile(p));
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setSession(session);
        if (session?.user) {
          const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
          setProfile(p);
        } else {
          setProfile(null);
          if (event === 'SIGNED_OUT') navigate('/');
        }
      })();
    });

    return () => authListener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/lesen" element={<ProtectedRoute><Lesen /></ProtectedRoute>} />
      <Route path="/hoeren" element={<ProtectedRoute><Hoeren /></ProtectedRoute>} />
      <Route path="/schreiben" element={<ProtectedRoute><Schreiben /></ProtectedRoute>} />
      <Route path="/sprechen" element={<ProtectedRoute><Sprechen /></ProtectedRoute>} />
      <Route path="/vocabulary" element={<ProtectedRoute><Vocabulary /></ProtectedRoute>} />
      <Route path="/grammar" element={<ProtectedRoute><Grammar /></ProtectedRoute>} />
      <Route path="/mock-exam" element={<ProtectedRoute><MockExam /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
