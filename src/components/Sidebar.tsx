import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  Megaphone,
  GraduationCap,
  UserCheck,
  ShieldCheck,
  Sparkles,
  Briefcase,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['HR', 'Manager', 'Employee'],
    },
    {
      name: 'Employee Directory',
      href: '/employees',
      icon: Users,
      roles: ['HR', 'Manager', 'Employee'],
      badge: user?.role === 'HR' ? 'Admin' : undefined,
    },
    {
      name: 'Attendance',
      href: '/attendance',
      icon: Clock,
      roles: ['HR', 'Manager', 'Employee'],
    },
    {
      name: 'Leaves & Time Off',
      href: '/leaves',
      icon: CalendarDays,
      roles: ['HR', 'Manager', 'Employee'],
      highlight: user?.role !== 'Employee',
    },
    {
      name: 'Announcements',
      href: '/announcements',
      icon: Megaphone,
      roles: ['HR', 'Manager', 'Employee'],
    },
    {
      name: 'Training & Programs',
      href: '/training',
      icon: GraduationCap,
      roles: ['HR', 'Manager', 'Employee'],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* User Card in Sidebar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SS'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.position || 'Associate'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">{user?.role} Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Main Menu</p>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                          isActive ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Role Permissions Summary Box */}
        <div className="p-3 m-3 bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-2xl border border-indigo-100/60">
          <div className="flex items-center gap-2 mb-1.5 text-indigo-700">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold">RBAC Active</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {user?.role === 'HR' && 'Full administrative oversight: manage staff, review all leaves, post company news & assign trainings.'}
            {user?.role === 'Manager' && 'Department lead: approve team leaves, inspect team attendance & supervise module completion.'}
            {user?.role === 'Employee' && 'Self-service: 1-click punch in/out, submit leave requests, and view assigned training.'}
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
