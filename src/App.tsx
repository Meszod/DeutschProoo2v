import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { ProtectedRoute, AdminRoute } from '@/components/ProtectedRoute';
import Landing from '@/pages/Landing';
import Auth from '@/pages/Auth';
import Onboarding from '@/pages/Onboarding';
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
import Admin from '@/pages/Admin';

function App() {
  const { setSession, setProfile, setLoading } = useStore();

  useEffect(() => {
    // Get initial session
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        setProfile(data);
      }
      setLoading(false);
    })();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        if (session?.user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
          setProfile(data);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, [setSession, setProfile, setLoading]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/login" element={<Auth mode="login" />} />
        <Route path="/auth/signup" element={<Auth mode="signup" />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/lesen" element={<ProtectedRoute><Layout><Lesen /></Layout></ProtectedRoute>} />
        <Route path="/hoeren" element={<ProtectedRoute><Layout><Hoeren /></Layout></ProtectedRoute>} />
        <Route path="/schreiben" element={<ProtectedRoute><Layout><Schreiben /></Layout></ProtectedRoute>} />
        <Route path="/sprechen" element={<ProtectedRoute><Layout><Sprechen /></Layout></ProtectedRoute>} />
        <Route path="/vocabulary" element={<ProtectedRoute><Layout><Vocabulary /></Layout></ProtectedRoute>} />
        <Route path="/grammar" element={<ProtectedRoute><Layout><Grammar /></Layout></ProtectedRoute>} />
        <Route path="/mock-exam" element={<ProtectedRoute><Layout><MockExam /></Layout></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Layout><Leaderboard /></Layout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
