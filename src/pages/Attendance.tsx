import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatCard from '../components/StatCard';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Filter,
  LogIn,
  LogOut,
  Users,
  Search,
  Download,
  CalendarDays,
  Check,
  TrendingUp,
} from 'lucide-react';

export const Attendance: React.FC = () => {
  const { user } = useAuth();
  const isHrOrManager = user?.role === 'HR' || user?.role === 'Manager';

  // Toggle view for HR/Manager: "My Attendance" vs "Team / All Attendance"
  const [viewScope, setViewScope] = useState<'my' | 'all'>(isHrOrManager ? 'all' : 'my');

  // Today punch status
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [punchLoading, setPunchLoading] = useState(false);
  const [liveClock, setLiveClock] = useState(new Date());

  // Attendance records & stats
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [stats, setStats] = useState({
    presentCount: 0,
    halfDayCount: 0,
    leaveCount: 0,
    totalHours: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchEmployee, setSearchEmployee] = useState('');

  // Clock interval
  useEffect(() => {
    const timer = setInterval(() => setLiveClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodayStatus = async () => {
    try {
      const res = await api.get('/attendance/today');
      if (res.data.success) {
        setTodayRecord(res.data.todayAttendance);
        setIsCheckedIn(res.data.isCheckedIn);
        setIsCheckedOut(res.data.isCheckedOut);
      }
    } catch (e) {
      console.error('Failed to get today status:', e);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      if (viewScope === 'my') {
        const res = await api.get('/attendance/my-attendance');
        if (res.data.success) {
          setAttendanceList(res.data.attendance);
          setStats(res.data.stats);
        }
      } else {
        const res = await api.get('/attendance/all');
        if (res.data.success) {
          setAttendanceList(res.data.attendance);
          // Aggregate stats for all
          const present = res.data.attendance.filter((a: any) => a.status === 'Present').length;
          const half = res.data.attendance.filter((a: any) => a.status === 'Half-Day').length;
          const totalH = res.data.attendance.reduce((sum: number, a: any) => sum + (a.totalHours || 0), 0);
          setStats({
            presentCount: present,
            halfDayCount: half,
            leaveCount: 0,
            totalHours: Math.round(totalH * 10) / 10,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching attendance logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  useEffect(() => {
    fetchAttendanceData();
  }, [viewScope]);

  const handleClockIn = async () => {
    try {
      setPunchLoading(true);
      const res = await api.post('/attendance/check-in');
      if (res.data.success) {
        setIsCheckedIn(true);
        setTodayRecord(res.data.attendance);
        fetchAttendanceData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Check-in failed');
    } finally {
      setPunchLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setPunchLoading(true);
      const res = await api.post('/attendance/check-out');
      if (res.data.success) {
        setIsCheckedOut(true);
        setTodayRecord(res.data.attendance);
        fetchAttendanceData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Check-out failed');
    } finally {
      setPunchLoading(false);
    }
  };

  // Filter list
  const filteredRecords = attendanceList.filter((item) => {
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    const matchesSearch =
      !searchEmployee ||
      (item.user?.name && item.user.name.toLowerCase().includes(searchEmployee.toLowerCase())) ||
      (item.user?.email && item.user.email.toLowerCase().includes(searchEmployee.toLowerCase())) ||
      (item.user?.department && item.user.department.toLowerCase().includes(searchEmployee.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Half-Day':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'On-Leave':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Absent':
      default:
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Attendance & Time Tracking
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Shift Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time biometric punch tracking, timesheets, and overtime tracking.
          </p>
        </div>

        {/* View Switcher for HR/Manager */}
        {isHrOrManager && (
          <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs self-start sm:self-auto">
            <button
              onClick={() => setViewScope('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewScope === 'all'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏢 {user?.role === 'HR' ? 'Company All Logs' : 'Team Logs'}
            </button>
            <button
              onClick={() => setViewScope('my')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewScope === 'my'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👤 My Timesheet
            </button>
          </div>
        )}
      </div>

      {/* Clock-In Widget & Shift Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                StaffSync Biometric Clock
              </span>
            </div>
            <p className="text-4xl font-black font-mono tracking-tight text-white">
              {liveClock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              {liveClock.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Today's Timestamps */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-[10px] font-bold text-slate-300 uppercase">Check-In</p>
                <p className="text-lg font-black text-white font-mono mt-0.5">
                  {todayRecord?.checkInTime || '--:--'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-300 uppercase">Check-Out</p>
                <p className="text-lg font-black text-white font-mono mt-0.5">
                  {todayRecord?.checkOutTime || '--:--'}
                </p>
              </div>
            </div>
            {todayRecord?.totalHours > 0 && (
              <p className="text-center text-xs text-indigo-200 font-bold mt-2 pt-2 border-t border-white/10">
                Completed Shift: {todayRecord.totalHours} hrs
              </p>
            )}
          </div>

          {/* Action Button */}
          <div className="flex flex-col gap-2">
            {!isCheckedIn ? (
              <button
                onClick={handleClockIn}
                disabled={punchLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>Clock In for Today</span>
              </button>
            ) : !isCheckedOut ? (
              <button
                onClick={handleClockOut}
                disabled={punchLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Clock Out & Complete Shift</span>
              </button>
            ) : (
              <div className="py-3 px-4 rounded-2xl bg-white/15 text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Shift Fully Logged Today</span>
              </div>
            )}
            <p className="text-[11px] text-center text-slate-400">
              {isCheckedIn && !isCheckedOut
                ? '🟢 Active timer running for your shift'
                : 'Standard 8h daily shift schedule'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Days Present"
          value={stats.presentCount}
          subtitle="On schedule"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Total Logged Hours"
          value={`${stats.totalHours} hrs`}
          subtitle="Calculated shift duration"
          icon={Clock}
          color="indigo"
        />
        <StatCard
          title="Half-Day Shifts"
          value={stats.halfDayCount}
          subtitle="Less than 4 hours"
          icon={AlertCircle}
          color="amber"
        />
        <StatCard
          title="Approved Leaves"
          value={stats.leaveCount}
          subtitle="Off duty logs"
          icon={CalendarDays}
          color="violet"
        />
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {viewScope === 'my' ? 'Personal Attendance Log' : 'Enterprise Attendance Records'}
            </h3>
            <p className="text-xs text-slate-500">
              Showing {filteredRecords.length} recorded attendance shifts
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {viewScope === 'all' && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchEmployee}
                  onChange={(e) => setSearchEmployee(e.target.value)}
                  placeholder="Filter employee..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Half-Day">Half-Day</option>
              <option value="On-Leave">On-Leave</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                {viewScope === 'all' && <th className="py-3 px-4">Employee</th>}
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Check-Out</th>
                <th className="py-3 px-4">Total Hours</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading attendance records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No attendance records match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                    {viewScope === 'all' && (
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.user?.name || 'Staff Member'}</div>
                        <div className="text-[11px] text-slate-400">{item.user?.department} • {item.user?.position}</div>
                      </td>
                    )}
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {new Date(item.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-600">
                      {item.checkInTime || '--:--'}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-600">
                      {item.checkOutTime || '--:--'}
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-700">
                      {item.totalHours ? `${item.totalHours} hrs` : '--'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
