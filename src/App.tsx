import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CourseList } from './components/CourseList';
import { CourseDetail } from './components/CourseDetail';
import { QuizBuilder } from './components/QuizBuilder';
import { CourseBuilder } from './components/CourseBuilder';
import { Settings } from './components/Settings';
import { Tasks } from './components/Tasks';
import { Analytics } from './components/Analytics';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Plus, Layout, CheckCircle2 } from 'lucide-react';

const MainContent = () => {
  const { user, isLoading, login, signup, onlineUsers } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isBuildingQuiz, setIsBuildingQuiz] = useState(false);
  const [isBuildingCourse, setIsBuildingCourse] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('apex_theme');
    return saved ? saved === 'dark' : true;
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newVal = !prev;
      localStorage.setItem('apex_theme', newVal ? 'dark' : 'light');
      return newVal;
    });
  };
  const [users, setUsers] = useState<any[]>([]);

  React.useEffect(() => {
    if (activeTab === 'users' && user) {
      fetch('/api/users')
        .then(res => res.json())
        .then(setUsers)
        .catch(err => console.error("Failed to fetch users:", err));
    }
  }, [activeTab, user]);

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse">Loading Apex-LMS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-slate-900 p-10 rounded-3xl shadow-xl border border-slate-800"
        >
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">
              A
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Apex-LMS</h1>
          </div>
          
          <h2 className="text-3xl font-bold mb-2 text-white">{isSignUp ? 'Create an account' : 'Welcome back'}</h2>
          <p className="text-slate-400 mb-8">
            {isSignUp ? 'Join our learning community today.' : 'Enter your credentials to access your workspace.'}
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 text-red-400 text-sm rounded-xl font-medium">
              <p className="font-bold mb-1">Authentication Error</p>
              <p>{error}</p>
              {error.includes('ECONNREFUSED') && (
                <p className="mt-2 text-xs opacity-80">Tip: It looks like the database is not connected. Please check your DATABASE_URL in the Secrets panel.</p>
              )}
              {!isSignUp && error.includes('Invalid credentials') && (
                <p className="mt-2 text-xs opacity-80">Tip: Try the default admin: admin@apex.com / admin123</p>
              )}
            </div>
          )}
          
          <form 
            onSubmit={async (e) => { 
              e.preventDefault(); 
              setError('');
              try {
                if (isSignUp) {
                  await signup(name, email, password);
                } else {
                  await login(email, password); 
                }
              } catch (err: any) {
                setError(err.message);
              }
            }} 
            className="space-y-6"
          >
            {isSignUp && (
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Email Address</label>
              <input 
                type="email" 
                required
                className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
              <input 
                type="password" 
                required
                className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand-primary/20 transition-all active:scale-[0.98] shadow-md"
            >
              <LogIn size={20} />
              <span className="text-lg">{isSignUp ? 'Create Account' : 'Login to Workspace'}</span>
            </button>
          </form>
          
          <p className="mt-8 text-center text-sm text-slate-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"} 
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-1 text-brand-primary font-semibold hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab: string) => { setActiveTab(tab); setSelectedCourse(null); setIsBuildingQuiz(false); setIsBuildingCourse(false); }} 
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={isBuildingQuiz ? 'quiz-builder' : (isBuildingCourse ? 'course-builder' : (selectedCourse ? `course-${selectedCourse.id}` : activeTab))}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {isBuildingQuiz ? (
              <QuizBuilder 
                onSave={(quiz: any) => {
                  console.log("Saving Quiz:", quiz);
                  fetch('/api/admin/quizzes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(quiz)
                  }).then(() => setIsBuildingQuiz(false));
                }}
                onCancel={() => setIsBuildingQuiz(false)}
              />
            ) : isBuildingCourse ? (
              <CourseBuilder 
                onSave={(course: any) => {
                  console.log("Saving Course:", course);
                  fetch('/api/courses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ...course,
                      instructor_id: user?.id,
                      tenant_id: user?.tenant_id,
                      is_published: true // Publishing by default for now as per user request
                    })
                  }).then(() => {
                    setIsBuildingCourse(false);
                    setActiveTab('courses');
                  }).catch(err => console.error("Failed to save course:", err));
                }}
                onCancel={() => setIsBuildingCourse(false)}
              />
            ) : selectedCourse ? (
              <CourseDetail course={selectedCourse} onBack={() => setSelectedCourse(null)} />
            ) : (
              <>
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'courses' && <CourseList onSelectCourse={setSelectedCourse} onCreateQuiz={() => setIsBuildingQuiz(true)} onCreateCourse={() => setIsBuildingCourse(true)} />}
                {activeTab === 'users' && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>User Management</h1>
                        <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
                          {user?.role === 'ADMIN' ? 'Manage learners and instructors across your organization.' : 'Connect with other members of the community.'}
                        </p>
                      </div>
                      {user?.role === 'ADMIN' && (
                        <div className="flex gap-3">
                          <button className={`flex items-center gap-2 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'} border px-6 py-3 rounded-2xl font-bold transition-all shadow-sm`}>
                            <Plus size={20} />
                            Add User
                          </button>
                          <button className={`flex items-center gap-2 ${isDarkMode ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'} px-6 py-3 rounded-2xl font-bold transition-all shadow-lg`}>
                            <Layout size={20} />
                            Bulk Upload (CSV)
                          </button>
                        </div>
                      )}
                    </div>

                    <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-[2.5rem] border shadow-sm overflow-hidden`}>
                      <table className="w-full text-left">
                        <thead className={`${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'} border-b`}>
                          <tr>
                            <th className={`px-8 py-4 text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>User</th>
                            <th className={`px-8 py-4 text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>Role</th>
                            <th className={`px-8 py-4 text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>Status</th>
                            <th className={`px-8 py-4 text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>Action</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                          {users.map((u, i) => {
                            const isOnline = onlineUsers.some((online: any) => online.id === u.id);
                            return (
                              <tr key={i} className={`${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/50'} transition-colors`}>
                                <td className="px-8 py-5">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full ${isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'} flex items-center justify-center font-bold`}>
                                      {u.name.charAt(0)}
                                    </div>
                                    <div>
                                      <p className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{u.name}</p>
                                      <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{u.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-5">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                                    u.role === 'ADMIN' ? (isDarkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600') :
                                    u.role === 'INSTRUCTOR' ? (isDarkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600') :
                                    (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')
                                  }`}>
                                    {u.role}
                                  </span>
                                </td>
                                <td className="px-8 py-5">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                      {isOnline ? 'Online' : 'Offline'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-8 py-5">
                                  <button className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}>
                                    Connect
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {activeTab === 'tasks' && <Tasks />}
                {activeTab === 'analytics' && <Analytics />}
                {activeTab === 'settings' && <Settings />}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
