import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  User, 
  Calendar,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';

export const Tasks = () => {
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Review React 19 Submissions', status: 'PENDING', assignee: 'Sarah Chen', dueDate: '2026-02-25' },
    { id: '2', title: 'Update AWS Course Content', status: 'IN_PROGRESS', assignee: 'Alex Johnson', dueDate: '2026-02-28' },
    { id: '3', title: 'Onboard New Instructors', status: 'COMPLETED', assignee: 'System Admin', dueDate: '2026-02-20' },
  ]);

  const [isAdding, setIsAdding] = useState(false);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'IN_PROGRESS': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 size={14} />;
      case 'IN_PROGRESS': return <Clock size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks & Assignments</h1>
          <p className="text-slate-500 mt-1">Track administrative duties and content updates.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-2xl font-bold hover:shadow-lg hover:shadow-brand-primary/20 transition-all"
        >
          <Plus size={20} />
          Create Task
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search tasks..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none shadow-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-slate-600 font-medium hover:bg-slate-50 transition-colors shadow-sm">
          <Filter size={20} />
          Status
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div 
              key={task.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-brand-primary/30 transition-all"
            >
              <div className="flex items-center gap-6 flex-1">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getStatusStyle(task.status)} border`}>
                  {getStatusIcon(task.status)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{task.title}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <User size={14} />
                      {task.assignee}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Calendar size={14} />
                      {task.dueDate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={`px-4 py-1.5 rounded-xl text-xs font-bold border ${getStatusStyle(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </div>
                <button className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                  <Trash2 size={18} />
                </button>
                <button className="p-2 text-slate-300 hover:text-slate-600 rounded-xl transition-all">
                  <MoreVertical size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
