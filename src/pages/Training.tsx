import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';
import {
  GraduationCap,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  Building,
  Users,
  Play,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const Training: React.FC = () => {
  const { user } = useAuth();
  const isHrOrManager = user?.role === 'HR' || user?.role === 'Manager';

  const [trainings, setTrainings] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewScope, setViewScope] = useState<'my' | 'all'>(isHrOrManager ? 'all' : 'my');

  // Filters
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: 'Engineering',
    assignedTo: [] as string[],
    dueDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const endpoint = viewScope === 'my' ? '/training/my-trainings' : '/training/all';
      const res = await api.get(endpoint);
      if (res.data.success) {
        setTrainings(res.data.trainings);
      }
    } catch (err) {
      console.error('Failed to load trainings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesList = async () => {
    try {
      const res = await api.get('/employees');
      if (res.data.success) {
        setEmployees(res.data.employees);
      }
    } catch (e) {
      console.error('Failed to load employee list for training:', e);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, [viewScope]);

  useEffect(() => {
    if (isHrOrManager) {
      fetchEmployeesList();
    }
  }, [isHrOrManager]);

  const handleStatusToggle = async (trainingId: string, currentStatus: string) => {
    let nextStatus = 'In-Progress';
    if (currentStatus === 'Upcoming') nextStatus = 'In-Progress';
    else if (currentStatus === 'In-Progress') nextStatus = 'Completed';
    else if (currentStatus === 'Completed') nextStatus = 'Upcoming';

    try {
      const res = await api.put(`/training/${trainingId}/status`, { status: nextStatus });
      if (res.data.success) {
        setTrainings((prev) =>
          prev.map((t) => (t._id === trainingId ? { ...t, status: nextStatus } : t))
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const res = await api.post('/training/assign', formData);
      if (res.data.success) {
        setIsAssignModalOpen(false);
        setFormData({
          title: '',
          description: '',
          department: 'Engineering',
          assignedTo: [],
          dueDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
        });
        fetchTrainings();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to assign training');
    } finally {
      setFormLoading(false);
    }
  };

  const filteredTrainings = trainings.filter((t) => {
    const matchesDept = selectedDept === 'All' || t.department === selectedDept;
    const matchesStatus = selectedStatus === 'All' || t.status === selectedStatus;
    return matchesDept && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'In-Progress':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Upcoming':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Training & Development
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              L&D Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Professional skill modules, cybersecurity certifications, and compliance programs.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isHrOrManager && (
            <>
              <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs">
                <button
                  onClick={() => setViewScope('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    viewScope === 'all'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Company Modules
                </button>
                <button
                  onClick={() => setViewScope('my')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    viewScope === 'my'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Assigned to Me
                </button>
              </div>

              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Assign Training</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white"
          >
            <option value="All">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Product Design">Product Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Management">Management</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Upcoming">Upcoming</option>
            <option value="In-Progress">In-Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          {filteredTrainings.length} course{filteredTrainings.length === 1 ? '' : 's'} available
        </span>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">
          Loading learning modules...
        </div>
      ) : filteredTrainings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No training courses found</h3>
          <p className="text-xs text-slate-400 mt-1">Try resetting the status filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTrainings.map((course) => {
            return (
              <div
                key={course._id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                      {course.department}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${getStatusBadge(
                        course.status
                      )}`}
                    >
                      {course.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1.5 leading-snug">
                    {course.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                    {course.description || 'Comprehensive workplace certification and self-paced professional training module.'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 py-3 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Due: {new Date(course.dueDate).toLocaleDateString()}</span>
                    </div>
                    {course.assignedUsers && (
                      <div className="flex items-center gap-1 font-semibold text-slate-500">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{course.assignedUsers.length} assigned</span>
                      </div>
                    )}
                  </div>

                  {/* Toggle button */}
                  <button
                    onClick={() => handleStatusToggle(course._id, course.status)}
                    className={`w-full mt-2 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      course.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : course.status === 'In-Progress'
                        ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-2xs'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
                    }`}
                  >
                    {course.status === 'Completed' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed (Click to Reset)</span>
                      </>
                    ) : course.status === 'In-Progress' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>In Progress (Click to Complete)</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start Training Program</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Training Modal (HR & Manager) */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Create & Assign Training Program"
        subtitle="Mandate professional learning or compliance modules for employees"
        maxWidth="lg"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Course Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. AWS Cloud Security Best Practices"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              >
                <option value="All">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Product Design">Product Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Management">Management</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Completion Deadline *</label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Curriculum Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Outline course learning objectives..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assign Specific Employees (Optional - Leave empty to assign by department)
            </label>
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50/50">
              {employees.map((emp) => (
                <label key={emp._id} className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded-lg text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.assignedTo.includes(emp._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          assignedTo: [...formData.assignedTo, emp._id],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          assignedTo: formData.assignedTo.filter((id) => id !== emp._id),
                        });
                      }
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-medium text-slate-800">{emp.name}</span>
                  <span className="text-[10px] text-slate-400">({emp.department})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
            >
              {formLoading ? 'Assigning...' : 'Assign Training Program'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Training;
