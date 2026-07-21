import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { Profile, Task, Attempt, Level, Skill } from '@/lib/types';
import { LEVELS } from '@/lib/helpers';
import {
  Shield, Users, FileText, Sparkles, BarChart3, Trash2, Plus, Search,
  TrendingUp, Activity, Check, X,
} from 'lucide-react';
import Layout from '@/components/Layout';

type AdminTab = 'dashboard' | 'users' | 'tasks' | 'generate' | 'analytics';

const TAB_COLORS: Record<AdminTab, string> = {
  dashboard: '#0ea5e9', users: '#10b981', tasks: '#8b5cf6', generate: '#f59e0b', analytics: '#ec4899',
};

export default function Admin() {
  const [tab, setTab] = useState<AdminTab>('dashboard');

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3 animate-slide-down">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `${TAB_COLORS[tab]}15`, color: TAB_COLORS[tab], boxShadow: `0 4px 14px ${TAB_COLORS[tab]}25` }}>
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Admin paneli</h1>
            <p className="text-sm text-slate-500">Boshqaruv tizimi</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-200">
          {([
            ['dashboard', 'Dashboard', BarChart3],
            ['users', 'Foydalanuvchilar', Users],
            ['tasks', 'Vazifalar', FileText],
            ['generate', 'Generatsiya', Sparkles],
            ['analytics', 'Tahlil', TrendingUp],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                tab === key ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && <AdminDashboard />}
        {tab === 'users' && <AdminUsers />}
        {tab === 'tasks' && <AdminTasks />}
        {tab === 'generate' && <AdminGenerate />}
        {tab === 'analytics' && <AdminAnalytics />}
      </div>
    </Layout>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, activeToday: 0, attemptsToday: 0, totalTasks: 0 });

  useEffect(() => {
    (async () => {
      const [{ count: users }, { count: tasks }, { count: activeToday }, { count: attemptsToday }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_activity_date', new Date().toISOString().split('T')[0]),
        supabase.from('attempts').select('*', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
      ]);
      setStats({ users: users || 0, activeToday: activeToday || 0, attemptsToday: attemptsToday || 0, totalTasks: tasks || 0 });
    })();
  }, []);

  const cards = [
    { label: 'Jami foydalanuvchilar', value: stats.users, icon: Users, gradient: 'from-sky-400 to-blue-600', bg: 'bg-sky-50' },
    { label: 'Bugungi faol', value: stats.activeToday, icon: Activity, gradient: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50' },
    { label: 'Bugungi urinishlar', value: stats.attemptsToday, icon: TrendingUp, gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-50' },
    { label: 'Jami vazifalar', value: stats.totalTasks, icon: FileText, gradient: 'from-violet-400 to-purple-600', bg: 'bg-violet-50' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="card card-hover p-5 group relative overflow-hidden animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className={`absolute -top-8 -right-8 w-24 h-24 ${c.bg} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />
            <div className={`relative w-11 h-11 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white shadow-lg mb-3 group-hover:scale-110 transition-transform`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900 relative">{c.value}</p>
            <p className="text-xs text-slate-500 mt-1 relative">{c.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setUsers(data || []); setLoading(false);
    })();
  }, []);

  const filtered = users.filter((u) => (u.full_name || '').toLowerCase().includes(search.toLowerCase()) || u.id.includes(search));

  async function toggleRole(u: Profile) {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    await supabase.from('profiles').update({ role: newRole }).eq('id', u.id);
    setUsers((prev) => prev.map((p) => (p.id === u.id ? { ...p, role: newRole as 'user' | 'admin' } : p)));
  }

  return (
    <div className="space-y-4">
      <div className="relative group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
        <input className="input pl-11" placeholder="Ism yoki ID bo'yicha qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-10 h-10 border-3 border-slate-200 border-t-brand-600 rounded-full animate-spin" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map((u, i) => (
              <div key={u.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition-colors animate-slide-down" style={{ animationDelay: `${i * 0.03}s` }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 flex items-center justify-center text-sm font-semibold">{(u.full_name || '?').charAt(0).toUpperCase()}</div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{u.full_name || 'Noma\'lum'}</p>
                    <p className="text-xs text-slate-400">{u.target_level || '—'} · {u.current_streak} streak · {u.total_points} pts</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {u.role === 'admin' && <span className="badge bg-amber-100 text-amber-700">Admin</span>}
                  <button onClick={() => toggleRole(u)} className="btn-ghost text-xs">{u.role === 'admin' ? 'User qilish' : 'Admin qilish'}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState({ skill: 'lesen' as Skill, level: 'A1' as Level, exam_type: 'Goethe', teil_number: 1, title: '', content: '{"text":"","questions":[]}' });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      setTasks(data || []);
    })();
  }, []);

  async function saveTask() {
    try {
      const content = JSON.parse(form.content);
      if (editing) {
        const { data } = await supabase.from('tasks').update({ skill: form.skill, level: form.level, exam_type: form.exam_type, teil_number: form.teil_number, title: form.title, content }).eq('id', editing.id).select().single();
        if (data) setTasks((prev) => prev.map((t) => (t.id === editing.id ? data : t)));
      } else {
        const { data } = await supabase.from('tasks').insert({ skill: form.skill, level: form.level, exam_type: form.exam_type, teil_number: Number(form.teil_number), title: form.title, content }).select().single();
        if (data) setTasks([data, ...tasks]);
      }
      setShowForm(false); setEditing(null);
    } catch { alert('JSON noto\'g\'ri formatda'); }
  }

  async function deleteTask(id: string) {
    if (!confirm('Vazifani o\'chirish?')) return;
    await supabase.from('tasks').delete().eq('id', id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function editTask(task: Task) {
    setEditing(task);
    setForm({ skill: task.skill, level: task.level, exam_type: task.exam_type || 'Goethe', teil_number: task.teil_number || 1, title: task.title, content: JSON.stringify(task.content, null, 2) });
    setShowForm(true);
  }

  return (
    <div className="space-y-4">
      <button onClick={() => { setShowForm(!showForm); setEditing(null); }} className="btn-primary"><Plus className="w-4 h-4" /> Vazifa qo'shish</button>
      {showForm && (
        <div className="card p-6 space-y-4 animate-slide-up">
          <h3 className="font-semibold text-slate-900">{editing ? 'Vazifani tahrirlash' : 'Yangi vazifa'}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="label">Skill</label><select className="input" value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value as Skill })}><option value="lesen">lesen</option><option value="hoeren">hoeren</option><option value="schreiben">schreiben</option><option value="sprechen">sprechen</option></select></div>
            <div><label className="label">Level</label><select className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as Level })}>{LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
            <div><label className="label">Teil</label><input type="number" className="input" value={form.teil_number} onChange={(e) => setForm({ ...form, teil_number: Number(e.target.value) })} /></div>
          </div>
          <div><label className="label">Sarlavha</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Kontent (JSON)</label><textarea className="input font-mono text-xs min-h-[200px]" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
          <div className="flex gap-2"><button onClick={saveTask} className="btn-primary">Saqlash</button><button onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary">Bekor qilish</button></div>
        </div>
      )}
      <div className="space-y-2">
        {tasks.map((task, i) => (
          <div key={task.id} className="card card-hover p-4 flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 0.03}s` }}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge bg-sky-50 text-sky-600">{task.skill}</span>
                <span className="badge bg-slate-100 text-slate-600">{task.level}</span>
                {task.teil_number && <span className="text-xs text-slate-400">Teil {task.teil_number}</span>}
              </div>
              <p className="font-medium text-slate-900 text-sm">{task.title}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => editTask(task)} className="btn-ghost px-2 text-xs">Tahrirlash</button>
              <button onClick={() => deleteTask(task.id)} className="btn-ghost px-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminGenerate() {
  const [skill, setSkill] = useState<Skill>('lesen');
  const [level, setLevel] = useState<Level>('B1');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function generate() {
    setGenerating(true); setResult(null);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-task`;
      const res = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` }, body: JSON.stringify({ skill, level }) });
      const data = await res.json();
      if (data.error) setResult(`Xatolik: ${data.error}\n\nEslatma: ANTHROPIC_API_KEY secret sifatida sozlanishi kerak.`);
      else setResult(JSON.stringify(data, null, 2));
    } catch (err) { setResult(`Xatolik: ${err instanceof Error ? err.message : 'Noma\'lum'}`); }
    finally { setGenerating(false); }
  }

  return (
    <div className="space-y-4">
      <div className="card p-6 space-y-4 animate-slide-up">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md"><Sparkles className="w-5 h-5" /></div>
          <h3 className="font-semibold text-slate-900">AI orqali vazifa generatsiya qilish</h3>
        </div>
        <p className="text-sm text-slate-500">Claude API (Anthropic) orqali original nemischa matn generatsiya qilinadi. ANTHROPIC_API_KEY secret sifatida sozlanishi kerak.</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Skill</label><select className="input" value={skill} onChange={(e) => setSkill(e.target.value as Skill)}><option value="lesen">lesen</option><option value="hoeren">hoeren</option><option value="schreiben">schreiben</option><option value="sprechen">sprechen</option></select></div>
          <div><label className="label">Level</label><select className="input" value={level} onChange={(e) => setLevel(e.target.value as Level)}>{LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
        </div>
        <button onClick={generate} disabled={generating} className="btn-primary">
          {generating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generatsiya...</> : <><Sparkles className="w-4 h-4" /> Generatsiya qilish</>}
        </button>
      </div>
      {result && (
        <div className="card p-6 animate-slide-up">
          <h4 className="font-semibold text-slate-900 mb-2">Natija:</h4>
          <pre className="text-xs font-mono text-slate-600 bg-slate-50 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap scrollbar-thin">{result}</pre>
        </div>
      )}
    </div>
  );
}

function AdminAnalytics() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('attempts').select('*').order('created_at', { ascending: false }).limit(500);
      setAttempts(data || []); setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="w-10 h-10 border-3 border-slate-200 border-t-brand-600 rounded-full animate-spin" /></div>;

  const skillStats: Record<string, { count: number; avgPct: number }> = {};
  attempts.forEach((a) => {
    if (!skillStats[a.skill]) skillStats[a.skill] = { count: 0, avgPct: 0 };
    skillStats[a.skill].count++;
    if (a.score && a.max_score) skillStats[a.skill].avgPct += (Number(a.score) / Number(a.max_score)) * 100;
  });
  Object.keys(skillStats).forEach((k) => { skillStats[k].avgPct = skillStats[k].count > 0 ? Math.round(skillStats[k].avgPct / skillStats[k].count) : 0; });

  const skillColors: Record<string, string> = { lesen: '#0ea5e9', hoeren: '#8b5cf6', schreiben: '#f59e0b', sprechen: '#10b981' };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(skillStats).map(([skill, stats], i) => (
          <div key={skill} className="card card-hover p-5 group animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${skillColors[skill]}15` }}>
                <div className="w-3 h-3 rounded-full" style={{ background: skillColors[skill] }} />
              </div>
              <p className="text-sm font-medium text-slate-500 capitalize">{skill}</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.count}</p>
            <p className="text-xs text-slate-400 mt-1">O'rtacha: {stats.avgPct}%</p>
          </div>
        ))}
      </div>
      <div className="card p-6 animate-slide-up">
        <h3 className="font-semibold text-slate-900 mb-3">So'nggi urinishlar</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
          {attempts.slice(0, 50).map((a, i) => (
            <div key={a.id} className="flex items-center justify-between text-sm border-b border-slate-50 py-2 hover:bg-slate-50/50 transition-colors animate-slide-down" style={{ animationDelay: `${i * 0.02}s` }}>
              <div className="flex items-center gap-2">
                <span className="badge capitalize" style={{ background: `${skillColors[a.skill]}15`, color: skillColors[a.skill] }}>{a.skill}</span>
                <span className="text-slate-500">{a.level || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-900 font-medium">{a.score}/{a.max_score}</span>
                <span className="text-xs text-slate-400">{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
