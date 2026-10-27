import React from 'react';
import { useAuth, UserRole } from '../context/AuthContext';
import { LogOut, User as UserIcon, Shield, ChevronDown, CheckCircle2, Sparkles, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, quickLogin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [switchLoading, setSwitchLoading] = React.useState<UserRole | null>(null);

  const handleRoleSwitch = async (role: UserRole) => {
    try {
      setSwitchLoading(role);
      await quickLogin(role);
    } catch (e) {
      console.error('Failed to quick switch:', e);
    } finally {
      setSwitchLoading(null);
    }
  };

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'HR':
        return {
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          dot: 'bg-purple-600',
          label: 'HR / Admin',
        };
      case 'Manager':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          dot: 'bg-blue-600',
          label: 'Team Manager',
        };
      case 'Employee':
      default:
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-600',
          label: 'Staff Employee',
        };
    }
  };

  const roleStyle = getRoleBadge(user?.role);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 h-16 flex items-center px-4 lg:px-6 justify-between shadow-2xs">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-xs font-bold text-lg">
            S
          </div>
          <div>
            <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">StaffSync</span>
            <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
              HRMS
            </span>
          </div>
        </div>
      </div>

      {/* Role Quick Switcher for seamless testing */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden md:flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs">
          <span className="px-2 font-medium text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Switch Demo Role:
          </span>
          <button
            onClick={() => handleRoleSwitch('HR')}
            disabled={user?.role === 'HR' || switchLoading !== null}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              user?.role === 'HR'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-slate-700 hover:bg-white hover:text-purple-700'
            }`}
          >
            👑 HR Admin
          </button>
          <button
            onClick={() => handleRoleSwitch('Manager')}
            disabled={user?.role === 'Manager' || switchLoading !== null}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              user?.role === 'Manager'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-700 hover:bg-white hover:text-blue-700'
            }`}
          >
            👔 Manager
          </button>
          <button
            onClick={() => handleRoleSwitch('Employee')}
            disabled={user?.role === 'Employee' || switchLoading !== null}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              user?.role === 'Employee'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-700 hover:bg-white hover:text-emerald-700'
            }`}
          >
            💼 Employee
          </button>
        </div>

        {/* Current User Pill & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 text-left"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-xs uppercase">
              {user?.name ? user.name.slice(0, 2) : 'SS'}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold border ${roleStyle.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${roleStyle.dot}`}></span>
                  {roleStyle.label}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <p className="text-[11px] text-indigo-600 font-medium mt-0.5">{user?.position} • {user?.department}</p>
              </div>

              {/* Mobile Role Switcher */}
              <div className="md:hidden px-3 py-2 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Switch Demo Role</p>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => {
                      handleRoleSwitch('HR');
                      setDropdownOpen(false);
                    }}
                    className="p-1.5 text-center text-xs rounded-lg font-medium bg-purple-50 text-purple-700 hover:bg-purple-100"
                  >
                    👑 HR
                  </button>
                  <button
                    onClick={() => {
                      handleRoleSwitch('Manager');
                      setDropdownOpen(false);
                    }}
                    className="p-1.5 text-center text-xs rounded-lg font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    👔 Mgr
                  </button>
                  <button
                    onClick={() => {
                      handleRoleSwitch('Employee');
                      setDropdownOpen(false);
                    }}
                    className="p-1.5 text-center text-xs rounded-lg font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  >
                    💼 Emp
                  </button>
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  My Profile & Contact Info
                </Link>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
