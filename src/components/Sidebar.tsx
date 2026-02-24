import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Settings, 
  BarChart3, 
  LogOut,
  ChevronRight,
  Menu,
  X,
  CheckSquare,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../AuthContext';

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' 
        : 'text-slate-500 hover:bg-slate-800 hover:text-slate-100'
    }`}
  >
    <Icon size={20} className={active ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
    {!collapsed && <span className="font-medium text-sm">{label}</span>}
    {active && !collapsed && <ChevronRight size={16} className="ml-auto opacity-50" />}
  </button>
);

export const Sidebar = ({ activeTab, setActiveTab, isDarkMode, toggleTheme }: any) => {
  const { user, tenant, logout } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      className="h-screen bg-slate-900 border-r border-slate-800 flex flex-col sticky top-0"
    >
      <div className="p-6 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold">
              A
            </div>
            <span className="font-bold text-xl tracking-tight text-white">{tenant?.name || 'Apex'}</span>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-500"
        >
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.id}
            {...item}
            active={activeTab === item.id}
            onClick={() => setActiveTab(item.id)}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-800 hover:text-slate-100 rounded-xl transition-colors mb-2"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          {!collapsed && <span className="font-medium text-sm">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-medium border border-slate-700">
              {user?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate text-slate-100">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-red-900/20 hover:text-red-400 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
};
