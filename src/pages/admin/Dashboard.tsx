import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api, Result } from '../../lib/db';
import { Users, FileQuestion, KeyRound, Activity, LogOut, LayoutDashboard, Settings, Trophy, Clock, CheckCircle, Upload, Menu, X } from 'lucide-react';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSidebar, setShowSidebar] = useState(false);

  const links = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/admin/students', label: 'Students', icon: <Users size={20} /> },
    { to: '/admin/monitor', label: 'Monitoring', icon: <Activity size={20} /> },
    { to: '/admin/questions', label: 'Question Bank', icon: <FileQuestion size={20} /> },
    { to: '/admin/import', label: 'Import', icon: <Upload size={20} /> },
    { to: '/admin/tokens', label: 'Exam Tokens', icon: <KeyRound size={20} /> },
    { to: '/admin/results', label: 'Results', icon: <Activity size={20} /> },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      {/* Mobile Overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar - Drawer on Mobile */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50
        w-64 md:w-64 
        bg-text-main text-white flex flex-col shadow-xl
        transform transition-transform duration-300 ease-in-out
        ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        h-full
      `}>
        {/* Mobile Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings size={28} className="text-primary" />
            <span className="font-black text-xl tracking-wider">TKA ADMIN</span>
          </div>
          <button
            onClick={() => setShowSidebar(false)}
            className="md:hidden w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map(link => {
            const active = location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setShowSidebar(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${active
                  ? 'bg-primary text-white border border-primary-hover shadow-lg'
                  : 'text-text-muted hover:bg-white/5 hover:text-white'
                  }`}
              >
                {link.icon}
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => { logout(); navigate('/admin/login'); }}
            className="flex items-center gap-3 px-4 py-3 rounded text-danger hover:bg-danger/10 w-full font-bold transition-colors uppercase tracking-wider text-sm"
          >
            <LogOut size={20} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-text-main text-white flex items-center justify-between px-4 z-30 shadow-lg">
        <button
          onClick={() => setShowSidebar(true)}
          className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        <span className="font-bold text-lg tracking-wider">TKA ADMIN</span>
        <div className="w-10"></div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-16 md:pt-8 relative">
        <div className="max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = React.useState({
    totalQuestions: 0,
    totalStudents: 0,
    totalTokens: 0,
    averageScore: 0,
    breakdown: {
      pilihan_ganda: 0,
      pilihan_ganda_kompleks: 0,
      mcma: 0
    }
  });

  const [recentResults, setRecentResults] = React.useState<Result[]>([]);

  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
          const [questions, students, tokens, results] = await Promise.all([
            api.getQuestions(),
            api.getStudents(),
            api.getTokens(),
            api.getResults()
          ]);

          const sumScore = results.reduce((acc, r) => acc + r.score, 0);
          const avgScore = results.length ? Math.round(sumScore / results.length) : 0;

          const qBreakdown = {
            pilihan_ganda: questions.filter(q => q.type === 'pilihan_ganda').length,
            pilihan_ganda_kompleks: questions.filter(q => q.type === 'pilihan_ganda_kompleks').length,
            mcma: questions.filter(q => q.type === 'multiple_choice_multiple_answer').length
          };

          setStats({
            totalQuestions: questions.length,
            totalStudents: students.length,
            totalTokens: tokens.length,
            averageScore: avgScore,
            breakdown: qBreakdown
          });

          const latest = [...results].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
          setRecentResults(latest);
      } catch (err) {
          console.error("Dashboard data load error:", err);
      } finally {
          setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 border-b border-border pb-4 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-text-main tracking-tight">System Overview</h1>
          <p className="text-text-muted mt-1 sm:mt-2 font-medium text-sm sm:text-base">Welcome back to the admin dashboard.</p>
        </div>
      </div>

      {/* Stats Grid - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
        <div className="card flex flex-col gap-3 sm:gap-4 bg-gradient-to-br from-primary to-primary-hover text-white border-none shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <FileQuestion size={20} className="sm:w-7 sm:h-7 text-white" />
            </div>
            <span className="text-white/60 text-[10px] sm:text-sm font-bold uppercase tracking-wider">Bank</span>
          </div>
          <div>
            <div className="text-3xl sm:text-5xl font-black mb-1">{stats.totalQuestions}</div>
            <div className="text-white/80 font-semibold tracking-wide flex flex-col gap-1">
              <span className="text-xs sm:text-sm">Total Questions</span>
              <div className="hidden sm:flex gap-2 text-[10px] uppercase font-bold text-white/50">
                <span>{stats.breakdown.pilihan_ganda} PG</span>
                <span>•</span>
                <span>{stats.breakdown.pilihan_ganda_kompleks} PK</span>
                <span>•</span>
                <span>{stats.breakdown.mcma} MCMA</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card flex flex-col gap-3 sm:gap-4 bg-gradient-to-br from-secondary to-secondary-hover text-white border-none shadow-lg shadow-secondary/20 hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users size={20} className="sm:w-7 sm:h-7 text-white" />
            </div>
            <span className="text-white/60 text-[10px] sm:text-sm font-bold uppercase tracking-wider">Users</span>
          </div>
          <div>
            <div className="text-3xl sm:text-5xl font-black mb-1">{stats.totalStudents}</div>
            <div className="text-white/80 font-semibold tracking-wide text-xs sm:text-sm">Registered Students</div>
          </div>
        </div>

        <div className="card flex flex-col gap-3 sm:gap-4 bg-gradient-to-br from-warning to-yellow-600 text-white border-none shadow-lg shadow-warning/20 hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <KeyRound size={20} className="sm:w-7 sm:h-7 text-white" />
            </div>
            <span className="text-white/60 text-[10px] sm:text-sm font-bold uppercase tracking-wider">Access</span>
          </div>
          <div>
            <div className="text-3xl sm:text-5xl font-black mb-1">{stats.totalTokens}</div>
            <div className="text-white/80 font-semibold tracking-wide text-xs sm:text-sm">Active Tokens</div>
          </div>
        </div>

        <div className="card flex flex-col gap-3 sm:gap-4 bg-gradient-to-br from-text-main to-text-muted text-white border-none shadow-lg shadow-text-main/20 hover:scale-[1.02] transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Activity size={20} className="sm:w-7 sm:h-7 text-white" />
            </div>
            <span className="text-white/60 text-[10px] sm:text-sm font-bold uppercase tracking-wider">Metrics</span>
          </div>
          <div>
            <div className="text-3xl sm:text-5xl font-black mb-1">{stats.averageScore}%</div>
            <div className="text-white/80 font-semibold tracking-wide text-xs sm:text-sm">Average Score</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
        {/* Recent Results */}
        <div className="lg:col-span-2 card bg-surface p-4 sm:p-6 md:p-8 rounded-2xl border border-border shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Clock size={18} className="sm:w-5 sm:h-5 text-primary" />
              <span className="hidden xs:inline">Recent Exam Results</span>
              <span className="xs:hidden">Results</span>
            </h2>
            <Link to="/admin/results" className="text-primary text-xs sm:text-sm font-bold hover:underline">View All</Link>
          </div>

          {recentResults.length > 0 ? (
            <div className="space-y-3 sm:space-y-4 flex-1">
              {recentResults.map(res => (
                <div key={res.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 bg-background rounded-xl border border-border/50 hover:border-primary/50 transition-colors gap-3">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm sm:text-base">
                      {res.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-text-main text-sm sm:text-base">{res.studentName}</div>
                      <div className="text-xs sm:text-sm text-text-muted hidden sm:block">{res.school} • {new Date(res.timestamp).toLocaleDateString()}</div>
                      <div className="text-xs text-text-muted sm:hidden">{new Date(res.timestamp).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg font-bold text-sm sm:text-base ${res.score >= 70 ? 'bg-secondary/10 text-secondary' : res.score >= 50 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>
                    {res.score}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-text-muted min-h-[150px] sm:min-h-[200px] border-2 border-dashed border-border rounded-xl bg-background/50">
              <Trophy size={32} className="sm:w-12 sm:h-12 opacity-20 mb-2 sm:mb-4" />
              <p className="font-medium text-sm sm:text-lg">No exam results yet.</p>
              <p className="text-xs sm:text-sm hidden sm:block">When students finish exams, their scores will appear here.</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card bg-surface p-4 sm:p-6 md:p-8 rounded-2xl border border-border shadow-sm flex flex-col h-full">
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
            <CheckCircle size={18} className="sm:w-5 sm:h-5 text-secondary" />
            <span className="hidden sm:inline">Quick Actions</span>
            <span className="sm:hidden">Actions</span>
          </h2>
          <div className="grid gap-3 sm:gap-4 flex-1">
            <Link to="/admin/questions" className="btn btn-outline border-primary text-primary hover:bg-primary/5 flex justify-start items-center gap-3 sm:gap-4 py-3 sm:py-4 text-sm sm:text-lg">
              <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg"><FileQuestion size={18} className="sm:w-6 sm:h-6" /></div>
              <span className="hidden sm:inline">Add New Question</span>
              <span className="sm:hidden">Add Question</span>
            </Link>
            <Link to="/admin/tokens" className="btn btn-outline border-secondary text-secondary hover:bg-secondary/5 flex justify-start items-center gap-3 sm:gap-4 py-3 sm:py-4 text-sm sm:text-lg">
              <div className="bg-secondary/10 p-1.5 sm:p-2 rounded-lg"><KeyRound size={18} className="sm:w-6 sm:h-6" /></div>
              <span className="hidden sm:inline">Generate Token</span>
              <span className="sm:hidden">Token</span>
            </Link>
            <Link to="/admin/results" className="btn btn-outline border-text-main text-text-main hover:bg-text-main/5 flex justify-start items-center gap-3 sm:gap-4 py-3 sm:py-4 text-sm sm:text-lg">
              <div className="bg-text-main/10 p-1.5 sm:p-2 rounded-lg"><Activity size={18} className="sm:w-6 sm:h-6" /></div>
              <span className="hidden sm:inline">Export Results</span>
              <span className="sm:hidden">Export</span>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
export { AdminLayout };
