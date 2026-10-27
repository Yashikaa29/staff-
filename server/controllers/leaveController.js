import Leave from '../models/Leave.js';
import User from '../models/User.js';
import { inMemoryDB, isUsingInMemory } from '../config/db.js';

// @desc    Apply for a leave
// @route   POST /api/leaves/apply
// @access  Private
export const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const userId = req.user._id;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide leave type, start date, end date, and reason.',
      });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after or equal to start date.',
      });
    }

    if (isUsingInMemory()) {
      const newLeave = {
        _id: '67c1c' + Math.floor(1000000000000000000 + Math.random() * 9000000000000000000).toString(16).substring(0, 19),
        userId,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason: reason.trim(),
        status: 'Pending',
        reviewedBy: null,
        reviewComments: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      inMemoryDB.leaves.unshift(newLeave);

      return res.status(201).json({
        success: true,
        message: 'Leave application submitted successfully',
        leave: newLeave,
      });
    }

    // Mongoose path
    const leave = await Leave.create({
      userId,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason.trim(),
      status: 'Pending',
    });

    return res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      leave,
    });
  } catch (error) {
    console.error('Apply leave error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit leave request',
      error: error.message,
    });
  }
};

// @desc    Get current user's leave requests
// @route   GET /api/leaves/my-leaves
// @access  Private
export const getMyLeaves = async (req, res) => {
  try {
    const userId = req.user._id;

    if (isUsingInMemory()) {
      const leaves = inMemoryDB.leaves
        .filter((l) => l.userId.toString() === userId.toString())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const enriched = leaves.map((l) => {
        const reviewer = l.reviewedBy
          ? inMemoryDB.users.find((u) => u._id.toString() === l.reviewedBy.toString())
          : null;
        return {
          ...l,
          reviewerName: reviewer ? reviewer.name : null,
        };
      });

      // Compute balance stats
      const pendingCount = leaves.filter((l) => l.status === 'Pending').length;
      const approvedCount = leaves.filter((l) => l.status === 'Approved').length;
      const rejectedCount = leaves.filter((l) => l.status === 'Rejected').length;

      return res.status(200).json({
        success: true,
        summary: {
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          annualQuota: 18,
          annualUsed: leaves
            .filter((l) => l.leaveType === 'Annual' && l.status === 'Approved')
            .length * 2, // approximation for demo
          sickQuota: 12,
          sickUsed: leaves
            .filter((l) => l.leaveType === 'Sick' && l.status === 'Approved')
            .length * 1,
        },
        leaves: enriched,
      });
    }

    const leaves = await Leave.find({ userId })
      .populate('reviewedBy', 'name email position')
      .sort({ createdAt: -1 });

    const pendingCount = leaves.filter((l) => l.status === 'Pending').length;
    const approvedCount = leaves.filter((l) => l.status === 'Approved').length;
    const rejectedCount = leaves.filter((l) => l.status === 'Rejected').length;

    const formatted = leaves.map((l) => ({
      ...l.toObject(),
      reviewerName: l.reviewedBy ? l.reviewedBy.name : null,
    }));

    return res.status(200).json({
      success: true,
      summary: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        annualQuota: 18,
        annualUsed: 4,
        sickQuota: 12,
        sickUsed: 2,
      },
      leaves: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve leave history',
      error: error.message,
    });
  }
};

// @desc    Get pending leave applications for review (HR & Manager)
// @route   GET /api/leaves/pending
// @access  Private (HR & Manager)
export const getPendingLeaves = async (req, res) => {
  try {
    const isHr = req.user.role === 'HR';
    const isManager = req.user.role === 'Manager';

    if (isUsingInMemory()) {
      let leaves = inMemoryDB.leaves
        .filter((l) => l.status === 'Pending')
        .map((l) => {
          const applicant = inMemoryDB.users.find(
            (u) => u._id.toString() === l.userId.toString()
          );
          return {
            ...l,
            applicant: applicant
              ? {
                  _id: applicant._id,
                  name: applicant.name,
                  email: applicant.email,
                  department: applicant.department,
                  position: applicant.position,
                  managerId: applicant.managerId,
                }
              : null,
          };
        });

      if (isManager && !isHr) {
        leaves = leaves.filter(
          (l) =>
            l.applicant &&
            l.applicant.managerId?.toString() === req.user._id.toString()
        );
      }

      leaves.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return res.status(200).json({
        success: true,
        count: leaves.length,
        leaves,
      });
    }

    let query = { status: 'Pending' };

    let leaves = await Leave.find(query)
      .populate('userId', 'name email department position managerId')
      .sort({ createdAt: -1 });

    if (isManager && !isHr) {
      leaves = leaves.filter(
        (l) =>
          l.userId &&
          l.userId.managerId?.toString() === req.user._id.toString()
      );
    }

    const formatted = leaves.map((l) => ({
      ...l.toObject(),
      applicant: l.userId,
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      leaves: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending leaves',
      error: error.message,
    });
  }
};

// @desc    Get all leaves (HR & Manager)
// @route   GET /api/leaves/all
// @access  Private (HR & Manager)
export const getAllLeaves = async (req, res) => {
  try {
    const isHr = req.user.role === 'HR';
    const isManager = req.user.role === 'Manager';

    if (isUsingInMemory()) {
      let leaves = inMemoryDB.leaves.map((l) => {
        const applicant = inMemoryDB.users.find(
          (u) => u._id.toString() === l.userId.toString()
        );
        const reviewer = l.reviewedBy
          ? inMemoryDB.users.find((u) => u._id.toString() === l.reviewedBy.toString())
          : null;
        return {
          ...l,
          applicant: applicant
            ? {
                _id: applicant._id,
                name: applicant.name,
                email: applicant.email,
                department: applicant.department,
                position: applicant.position,
                managerId: applicant.managerId,
              }
            : null,
          reviewerName: reviewer ? reviewer.name : null,
        };
      });

      if (isManager && !isHr) {
        leaves = leaves.filter(
          (l) =>
            l.applicant &&
            (l.applicant.managerId?.toString() === req.user._id.toString() ||
              l.userId.toString() === req.user._id.toString())
        );
      }

      leaves.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return res.status(200).json({
        success: true,
        count: leaves.length,
        leaves,
      });
    }

    let leaves = await Leave.find()
      .populate('userId', 'name email department position managerId')
      .populate('reviewedBy', 'name email position')
      .sort({ createdAt: -1 });

    if (isManager && !isHr) {
      leaves = leaves.filter(
        (l) =>
          l.userId &&
          (l.userId.managerId?.toString() === req.user._id.toString() ||
            l.userId._id.toString() === req.user._id.toString())
      );
    }

    const formatted = leaves.map((l) => ({
      ...l.toObject(),
      applicant: l.userId,
      reviewerName: l.reviewedBy ? l.reviewedBy.name : null,
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      leaves: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve all leaves',
      error: error.message,
    });
  }
};

// @desc    Update leave status (Approve / Reject)
// @route   PUT /api/leaves/:id/status
// @access  Private (HR & Manager)
export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewComments } = req.body;
    const reviewerId = req.user._id;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either Approved or Rejected',
      });
    }

    if (isUsingInMemory()) {
      const leave = inMemoryDB.leaves.find((l) => l._id.toString() === id.toString());
      if (!leave) {
        return res.status(404).json({ success: false, message: 'Leave request not found' });
      }

      leave.status = status;
      leave.reviewedBy = reviewerId;
      leave.reviewComments = reviewComments || (status === 'Approved' ? 'Approved by supervisor' : 'Rejected');
      leave.updatedAt = new Date();

      return res.status(200).json({
        success: true,
        message: `Leave request has been marked as ${status}`,
        leave,
      });
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    leave.status = status;
    leave.reviewedBy = reviewerId;
    leave.reviewComments = reviewComments || (status === 'Approved' ? 'Approved by supervisor' : 'Rejected');
    await leave.save();

    return res.status(200).json({
      success: true,
      message: `Leave request has been marked as ${status}`,
      leave,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update leave status',
      error: error.message,
    });
  }
};
