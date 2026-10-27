import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Check,
  X,
  AlertCircle,
  Calendar,
  MessageSquare,
  User,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export const Leaves: React.FC = () => {
  const { user } = useAuth();
  const isHr = user?.role === 'HR';
  const isManager = user?.role === 'Manager';
  const isHrOrManager = isHr || isManager;

  // Tabs for HR/Manager: "pending" | "all" | "my"
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'my'>(
    isHrOrManager ? 'pending' : 'my'
  );

  const [leavesList, setLeavesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    annualQuota: 18,
    annualUsed: 4,
    sickQuota: 12,
    sickUsed: 2,
  });

  // Modals
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<'Approved' | 'Rejected'>('Approved');
  const [reviewComments, setReviewComments] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    leaveType: 'Annual',
    startDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    reason: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      if (activeTab === 'pending') {
        const res = await api.get('/leaves/pending');
        if (res.data.success) {
          setLeavesList(res.data.leaves);
        }
      } else if (activeTab === 'all') {
        const res = await api.get('/leaves/all');
        if (res.data.success) {
          setLeavesList(res.data.leaves);
        }
      } else {
        const res = await api.get('/leaves/my-leaves');
        if (res.data.success) {
          setLeavesList(res.data.leaves);
          if (res.data.summary) {
            setSummary(res.data.summary);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [activeTab]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const res = await api.post('/leaves/apply', formData);
      if (res.data.success) {
        setIsApplyModalOpen(false);
        setFormData({
          leaveType: 'Annual',
          startDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
          endDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
          reason: '',
        });
        fetchLeaves();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenReview = (leave: any, action: 'Approved' | 'Rejected') => {
    setSelectedLeave(leave);
    setReviewAction(action);
    setReviewComments(
      action === 'Approved'
        ? 'Approved. Please coordinate handover with your team lead.'
        : 'Request cannot be accommodated during this sprint schedule.'
    );
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave) return;

    setFormLoading(true);
    try {
      const res = await api.put(`/leaves/${selectedLeave._id}/status`, {
        status: reviewAction,
        reviewComments,
      });
      if (res.data.success) {
        setIsReviewModalOpen(false);
        fetchLeaves();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update leave status');
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Pending':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Leaves & Time Off
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Absence Management
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Submit leave requests, review team applications, and track leave balances.
          </p>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Leave Balances Grid (Self-Service) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Annual Leave</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700">Paid</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">14</span>
            <span className="text-xs text-slate-400">/ 18 Days Left</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '77%' }} />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sick Leave</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700">Health</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">10</span>
            <span className="text-xs text-slate-400">/ 12 Days Left</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '83%' }} />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Casual Leave</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700">Personal</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">5</span>
            <span className="text-xs text-slate-400">/ 6 Days Left</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: '83%' }} />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Unpaid Leave</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">Special</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">0</span>
            <span className="text-xs text-slate-400">Days Taken</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Subject to manager sign-off</p>
        </div>
      </div>

      {/* Tabs and Content Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isHrOrManager && (
              <>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'pending'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ⏳ Pending Approvals
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'all'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  📋 All Company Requests
                </button>
              </>
            )}
            <button
              onClick={() => setActiveTab('my')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'my'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              👤 My Requests & History
            </button>
          </div>

          <span className="text-xs text-slate-400">
            {leavesList.length} request{leavesList.length === 1 ? '' : 's'} listed
          </span>
        </div>

        {/* Requests List */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Loading leave requests...
            </div>
          ) : leavesList.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No leave requests found</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeTab === 'pending'
                  ? 'All pending leave requests have been reviewed!'
                  : 'No applications found in this view.'}
              </p>
            </div>
          ) : (
            leavesList.map((leave) => {
              const applicantName = leave.applicant?.name || 'Staff Member';
              const isPending = leave.status === 'Pending';

              return (
                <div
                  key={leave._id}
                  className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {activeTab !== 'my' && (
                        <span className="font-bold text-sm text-slate-900">
                          {applicantName}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700">
                        {leave.leaveType} Leave
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(
                          leave.status
                        )}`}
                      >
                        {leave.status}
                      </span>
                      {leave.applicant?.department && (
                        <span className="text-[11px] text-slate-400">
                          • {leave.applicant.department}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(leave.startDate).toLocaleDateString()} to{' '}
                        {new Date(leave.endDate).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      "{leave.reason}"
                    </p>

                    {leave.reviewComments && (
                      <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-semibold text-slate-700">
                            Reviewer Feedback ({leave.reviewerName || 'Supervisor'}):
                          </span>{' '}
                          {leave.reviewComments}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions for HR/Manager on pending requests */}
                  {isHrOrManager && isPending && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenReview(leave, 'Approved')}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleOpenReview(leave, 'Rejected')}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-slate-200 text-xs font-bold transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Submit Time Off Application"
        subtitle="Request planned leave or medical time off for supervisor review"
        maxWidth="md"
      >
        <form onSubmit={handleApplySubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Category</label>
            <select
              value={formData.leaveType}
              onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
            >
              <option value="Annual">Annual / Vacation Leave (Paid)</option>
              <option value="Sick">Sick / Medical Leave (Paid)</option>
              <option value="Casual">Casual / Urgent Personal Leave (Paid)</option>
              <option value="Unpaid">Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason & Context *
            </label>
            <textarea
              required
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Provide a brief explanation for your leave application..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
            >
              {formLoading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Leave Modal (HR & Manager) */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`${reviewAction === 'Approved' ? 'Approve' : 'Reject'} Leave Request`}
        subtitle={`Action for ${selectedLeave?.applicant?.name || 'Staff Member'}`}
        maxWidth="md"
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <p className="font-semibold text-slate-800">
              {selectedLeave?.leaveType} Leave: {new Date(selectedLeave?.startDate).toLocaleDateString()} -{' '}
              {new Date(selectedLeave?.endDate).toLocaleDateString()}
            </p>
            <p className="text-slate-600 italic mt-1">"{selectedLeave?.reason}"</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reviewer Notes / Feedback to Applicant
            </label>
            <textarea
              rows={3}
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all ${
                reviewAction === 'Approved'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {formLoading
                ? 'Saving...'
                : `Confirm ${reviewAction === 'Approved' ? 'Approval' : 'Rejection'}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Leaves;
