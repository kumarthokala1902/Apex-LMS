import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  BookOpen, 
  CheckCircle2, 
  TrendingUp,
  ArrowUpRight,
  Clock,
  Activity
} from 'lucide-react';
import { useAuth } from '../AuthContext';

const StatCard = ({ label, value, icon: Icon, trend, color }: any) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <span className="flex items-center gap-1 text-emerald-400 text-sm font-medium bg-emerald-900/30 px-2 py-1 rounded-lg">
          <TrendingUp size={14} />
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-medium">{label}</h3>
    <p className="text-3xl font-bold mt-1 text-white">{value}</p>
  </motion.div>
);

export const Dashboard = () => {
  const [stats, setStats] = React.useState<any>(null);
  const { onlineUsers } = useAuth();

  React.useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(setStats);
  }, [onlineUsers.length]); // Refresh stats when online users change

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Overview</h1>
        <p className="text-slate-400 mt-1">Welcome back! Here's what's happening across your academy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Learners" 
          value={stats?.totalLearners || '0'} 
          icon={Users} 
          trend="+12%" 
          color="bg-indigo-600"
        />
        <StatCard 
          label="Active Courses" 
          value={stats?.totalCourses || '0'} 
          icon={BookOpen} 
          color="bg-blue-600"
        />
        <StatCard 
          label="Online Now" 
          value={onlineUsers.length.toString()} 
          icon={Activity} 
          color="bg-emerald-600"
        />
        <StatCard 
          label="Avg. Session Time" 
          value="42m" 
          icon={Clock} 
          color="bg-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Real-time Presence</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{onlineUsers.length} Active Users</span>
            </div>
          </div>
          <div className="space-y-4">
            {onlineUsers.length > 0 ? onlineUsers.map((u, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
                <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-100">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.role} • Active Now</p>
                </div>
                <div className="px-3 py-1 bg-emerald-900/30 text-emerald-400 text-[10px] font-bold rounded-full uppercase">
                  Connected
                </div>
              </div>
            )) : (
              <div className="text-center py-12">
                <p className="text-slate-500">No other users online right now.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-brand-primary p-8 rounded-3xl text-white relative overflow-hidden shadow-xl shadow-brand-primary/20">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Upgrade to Enterprise</h2>
            <p className="text-white/80 mb-6">Unlock advanced white-labeling, custom domains, and dedicated support.</p>
            <button className="bg-white text-brand-primary px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors">
              Learn More
            </button>
          </div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </div>
      </div>
    </div>
  );
};
