import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  UserCheck, 
  CreditCard, 
  Award, 
  Globe, 
  Briefcase, 
  Code, 
  Github, 
  Linkedin, 
  Calendar, 
  UserCog, 
  BarChart3, 
  Upload,
  Download,
  GraduationCap,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'mentor-mentee', label: 'Mentor-Mentee', icon: UserCheck },
  { id: 'fees', label: 'Fee Details', icon: CreditCard },
  { id: 'vac', label: 'VAC', icon: Award },
  { id: 'mooc', label: 'MOOC', icon: Globe },
  { id: 'internship', label: 'Internship', icon: Briefcase },
  { id: 'hackathon', label: 'Hackathon', icon: Code },
  { id: 'github', label: 'GitHub', icon: Github },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'timetable', label: 'Timetable', icon: Calendar },
  { id: 'faculty', label: 'Faculty', icon: UserCog },
  { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  { id: 'export', label: 'Export Data', icon: Download },
  { id: 'upload', label: 'Upload Data', icon: Upload },
];

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isOpen, setIsOpen }) => {
  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 lg:static lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="p-6 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-bold text-xl text-white tracking-tight">GFM Portal</h1>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="p-2 hover:bg-slate-800 rounded-lg lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
              activePage === item.id 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5",
              activePage === item.id ? "text-white" : "text-slate-400 group-hover:text-white"
            )} />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-300">Data Loaded</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
