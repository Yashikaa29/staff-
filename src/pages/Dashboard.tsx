import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatCard from '../components/StatCard';
import {
  Users,
  Clock,
  CalendarDays,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  GraduationCap,
  Sparkles,
  Calendar,
  Building,
  LogIn,
  LogOut,
  Bell,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeLeaves: 0,
    todayAttendance: 0,
    announcementsCount: 0,
    myTotalHours: 0,
    pendingLeavesCount: 0,
  });

  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [punchLoading, setPunchLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [myTrainings, setMyTrainings] = useState<any[]>([]);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch Today's Attendance status for current user
      const todayRes = await api.get('/attendance/today');
      if (todayRes.data.success) {
        setTodayAttendance(todayRes.data.todayAttendance);
        setIsCheckedIn(todayRes.data.isCheckedIn);
        setIsCheckedOut(todayRes.data.isCheckedOut);
      }

      // Fetch Announcements
      const annRes = await api.get('/announcements');
      if (annRes.data.success) {
        setRecentAnnouncements(annRes.data.announcements.slice(0, 3));
        setStats((prev) => ({ ...prev, announcementsCount: annRes.data.count }));
      }

      // Fetch Employees count
      const empRes = await api.get('/employees');
      if (empRes.data.success) {
        setStats((prev) => ({ ...prev, totalEmployees: empRes.data.count }));
      }

      // If HR or Manager, fetch pending leaves
      if (user?.role === 'HR' || user?.role === 'Manager') {
        const pendingRes = await api.get('/leaves/pending');
        if (pendingRes.data.success) {
          setPendingLeaves(pendingRes.data.leaves.slice(0, 4));
          setStats((prev) => ({
            ...prev,
            pendingLeavesCount: pendingRes.data.count,
            activeLeaves: pendingRes.data.count,
          }));
        }

        const allAttRes = await api.get('/attendance/all');
        if (allAttRes.data.success) {
          const presentToday = allAttRes.data.attendance.filter(
            (a: any) =>
              new Date(a.date).toDateString() === new Date().toDateString() &&
              a.status === 'Present'
          ).length;
          setStats((prev) => ({ ...prev, todayAttendance: presentToday }));
        }
      } else {
        // Employee attendance & leaves
        const myLeavesRes = await api.get('/leaves/my-leaves');
        if (myLeavesRes.data.success) {
          setStats((prev) => ({
            ...prev,
            activeLeaves: myLeavesRes.data.summary.pending,
          }));
        }

        const myAttRes = await api.get('/attendance/my-attendance');
        if (myAttRes.data.success) {
          setStats((prev) => ({
            ...prev,
            todayAttendance: myAttRes.data.stats.presentCount,
            myTotalHours: myAttRes.data.stats.totalHours,
          }));
        }
      }

      // Fetch Trainings
      const trainingRes = await api.get('/training/my-trainings');
      if (trainingRes.data.success) {
        setMyTrainings(trainingRes.data.trainings.slice(0, 3));
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleCheckIn = async () => {
    try {
      setPunchLoading(true);
      const res = await api.post('/attendance/check-in');
      if (res.data.success) {
        setIsCheckedIn(true);
        setTodayAttendance(res.data.attendance);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Check-in failed');
    } finally {
      setPunchLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setPunchLoading(true);
      const res = await api.post('/attendance/check-out');
      if (res.data.success) {
        setIsCheckedOut(true);
        setTodayAttendance(res.data.attendance);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Check-out failed');
    } finally {
      setPunchLoading(false);
    }
  };

  const handleReviewLeave = async (leaveId: string, status: 'Approved' | 'Rejected') => {
    try {
      await api.put(`/leaves/${leaveId}/status`, {
        status,
        reviewComments: `Fast-track review by ${user?.name}`,
      });
      // Refresh pending list
      setPendingLeaves((prev) => prev.filter((l) => l._id !== leaveId));
      setStats((prev) => ({ ...prev, pendingLeavesCount: Math.max(0, prev.pendingLeavesCount - 1) }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update leave');
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'High':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                {user?.role} Workspace
              </span>
              <span className="text-xs text-slate-400">• {user?.department}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              {user?.role === 'HR' && 'All enterprise personnel, attendance streams, and company broadcasts are operating at peak efficiency.'}
              {user?.role === 'Manager' && `Managing your direct engineering & operations reports. Review pending approvals and track team hours.`}
              {user?.role === 'Employee' && `Track your daily punch hours, submit time-off requests, and complete assigned career growth programs.`}
            </p>
          </div>

          {/* Quick Action Pill on Banner */}
          <div className="shrink-0 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[220px]">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Current Time</span>
              <span className="text-[10px] text-emerald-400 font-mono">LIVE</span>
            </p>
            <p className="text-2xl font-black font-mono tracking-tight text-white">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-xs text-slate-300 mt-1">
              {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Company Workforce"
          value={stats.totalEmployees || 5}
          subtitle={user?.role === 'Manager' ? 'Directory accessible' : 'Active team members'}
          icon={Users}
          badge="Active"
          color="indigo"
        />

        <StatCard
          title={user?.role === 'Employee' ? 'My Leave Requests' : 'Pending Leave Requests'}
          value={user?.role === 'Employee' ? stats.activeLeaves : stats.pendingLeavesCount}
          subtitle={user?.role === 'Employee' ? 'Active balance: 18 Days' : 'Awaiting approval review'}
          icon={CalendarDays}
          badge={stats.pendingLeavesCount > 0 ? 'Requires Action' : 'All Clear'}
          color={stats.pendingLeavesCount > 0 ? 'amber' : 'emerald'}
        />

        <StatCard
          title={user?.role === 'Employee' ? 'Total Logged Hours' : "Today's Attendance"}
          value={user?.role === 'Employee' ? `${stats.myTotalHours || 16.5} hrs` : `${stats.todayAttendance || 3} Present`}
          subtitle={user?.role === 'Employee' ? 'Past 30 days total' : 'Checked-in staff today'}
          icon={Clock}
          badge="Logged"
          color="cyan"
        />

        <StatCard
          title="Company News"
          value={stats.announcementsCount || 3}
          subtitle="Bulletins published"
          icon={Megaphone}
          badge="Updated"
          color="violet"
        />
      </div>

      {/* Interactive Punch In/Out & Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily 1-Click Attendance Widget */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">1-Click Attendance Tracker</h3>
                  <p className="text-[11px] text-slate-500">Record your daily work shift</p>
                </div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isCheckedOut
                    ? 'bg-slate-100 text-slate-700'
                    : isCheckedIn
                    ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isCheckedOut ? 'Shift Completed' : isCheckedIn ? 'Clocked In' : 'Not Clocked In'}
              </span>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-5">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-2xs">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Check-In</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {todayAttendance?.checkInTime || '--:--'}
                  </p>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-2xs">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Check-Out</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {todayAttendance?.checkOutTime || '--:--'}
                  </p>
                </div>
              </div>

              {todayAttendance?.totalHours > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Shift Duration:</span>
                  <span className="text-indigo-600 font-bold">{todayAttendance.totalHours} hrs</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {!isCheckedIn ? (
              <button
                onClick={handleCheckIn}
                disabled={punchLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>Clock In Now</span>
              </button>
            ) : !isCheckedOut ? (
              <button
                onClick={handleCheckOut}
                disabled={punchLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Clock Out & Complete Shift</span>
              </button>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-100 text-center text-xs font-semibold text-slate-600 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Today's attendance recorded</span>
              </div>
            )}

            <Link
              to="/attendance"
              className="w-full inline-flex items-center justify-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 py-1 transition-colors"
            >
              View Attendance History & Logs →
            </Link>
          </div>
        </div>

        {/* HR / Manager: Pending Leaves Drawer OR Employee: My Balance & Active Leave */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {user?.role === 'Employee' ? 'My Leave Overview' : 'Pending Leave Approvals'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {user?.role === 'Employee'
                      ? 'Annual & Sick balances and recent requests'
                      : 'Approve or reject employee time-off applications'}
                  </p>
                </div>
              </div>
              <Link
                to="/leaves"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
              >
                <span>Full Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {user?.role !== 'Employee' ? (
              pendingLeaves.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800">Inbox Zero</p>
                  <p className="text-[11px] text-slate-500">No pending leave requests awaiting your action.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pendingLeaves.map((leave) => (
                    <div
                      key={leave._id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-900">
                            {leave.applicant?.name || 'Staff Member'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700">
                            {leave.leaveType} Leave
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {leave.applicant?.department}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-1 italic">
                          "{leave.reason}"
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(leave.startDate).toLocaleDateString()} to{' '}
                          {new Date(leave.endDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleReviewLeave(leave._id, 'Approved')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReviewLeave(leave._id, 'Rejected')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold transition-all border border-slate-200"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // Employee Quick Balances
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Annual Leave</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">14</p>
                  <p className="text-[10px] text-slate-500">Days Remaining</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Sick Leave</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">10</p>
                  <p className="text-[10px] text-slate-500">Days Remaining</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Casual Leave</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">5</p>
                  <p className="text-[10px] text-slate-500">Days Remaining</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Unpaid</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">0</p>
                  <p className="text-[10px] text-slate-500">Days Taken</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Standard SLA response time: 24-48 business hours</span>
            <Link
              to="/leaves"
              className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              {user?.role === 'Employee' ? '+ Apply for Leave' : 'Review All Applications'}
            </Link>
          </div>
        </div>
      </div>

      {/* Announcements & Trainings Split Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Announcements Feed */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                <Megaphone className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Broadcasts & Announcements</h3>
            </div>
            <Link
              to="/announcements"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentAnnouncements.map((item) => (
              <div
                key={item._id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getPriorityBadge(
                      item.priority
                    )}`}
                  >
                    {item.priority} Priority
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">{item.title}</h4>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Assigned Training Modules */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Skill Growth & Training</h3>
            </div>
            <Link
              to="/training"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>All Courses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {myTrainings.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <GraduationCap className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">All Modules Completed</p>
                <p className="text-[11px] text-slate-500">Check back later for new development programs.</p>
              </div>
            ) : (
              myTrainings.map((t) => (
                <div
                  key={t._id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                      {t.department}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">{t.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Due: {new Date(t.dueDate).toLocaleDateString()}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase shrink-0 ${
                      t.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : t.status === 'In-Progress'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
