import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { inMemoryDB, isUsingInMemory } from '../config/db.js';

// Helper to format 12h time
const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Helper to calculate hours between two times
const calculateHours = (inTimeStr, outDate) => {
  try {
    // Parse checkInTime like "09:15 AM"
    const [time, modifier] = inTimeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const inDate = new Date(outDate);
    inDate.setHours(hours, minutes, 0, 0);

    const diffMs = Math.max(0, outDate.getTime() - inDate.getTime());
    const totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
    return totalHours;
  } catch (e) {
    return 8.0;
  }
};

// Helper for start and end of current day
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @desc    1-Click Attendance Check-In
// @route   POST /api/attendance/check-in
// @access  Private
export const checkIn = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const formattedCheckIn = formatTime(now);
    const { start, end } = getTodayRange();

    if (isUsingInMemory()) {
      const existing = inMemoryDB.attendance.find(
        (a) =>
          a.userId.toString() === userId.toString() &&
          new Date(a.date) >= start &&
          new Date(a.date) <= end
      );

      if (existing) {
        if (existing.checkInTime) {
          return res.status(400).json({
            success: false,
            message: 'You have already checked in for today at ' + existing.checkInTime,
            attendance: existing,
          });
        }
        existing.checkInTime = formattedCheckIn;
        existing.status = 'Present';
        existing.updatedAt = now;
        return res.status(200).json({
          success: true,
          message: `Checked in successfully at ${formattedCheckIn}`,
          attendance: existing,
        });
      }

      const newRecord = {
        _id: '67c1c' + Math.floor(1000000000000000000 + Math.random() * 9000000000000000000).toString(16).substring(0, 19),
        userId,
        date: new Date(now.toISOString().split('T')[0]),
        checkInTime: formattedCheckIn,
        checkOutTime: null,
        totalHours: 0,
        status: 'Present',
        createdAt: now,
        updatedAt: now,
      };

      inMemoryDB.attendance.unshift(newRecord);

      return res.status(201).json({
        success: true,
        message: `Checked in successfully at ${formattedCheckIn}`,
        attendance: newRecord,
      });
    }

    // Mongoose path
    let record = await Attendance.findOne({
      userId,
      date: { $gte: start, $lte: end },
    });

    if (record && record.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in for today at ' + record.checkInTime,
        attendance: record,
      });
    }

    if (record) {
      record.checkInTime = formattedCheckIn;
      record.status = 'Present';
      await record.save();
    } else {
      record = await Attendance.create({
        userId,
        date: new Date(),
        checkInTime: formattedCheckIn,
        status: 'Present',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Checked in successfully at ${formattedCheckIn}`,
      attendance: record,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record check-in',
      error: error.message,
    });
  }
};

// @desc    1-Click Attendance Check-Out
// @route   POST /api/attendance/check-out
// @access  Private
export const checkOut = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const formattedCheckOut = formatTime(now);
    const { start, end } = getTodayRange();

    if (isUsingInMemory()) {
      const record = inMemoryDB.attendance.find(
        (a) =>
          a.userId.toString() === userId.toString() &&
          new Date(a.date) >= start &&
          new Date(a.date) <= end
      );

      if (!record || !record.checkInTime) {
        return res.status(400).json({
          success: false,
          message: 'Cannot check out without checking in first today.',
        });
      }

      if (record.checkOutTime) {
        return res.status(400).json({
          success: false,
          message: 'You have already checked out today at ' + record.checkOutTime,
          attendance: record,
        });
      }

      const totalHours = calculateHours(record.checkInTime, now);
      record.checkOutTime = formattedCheckOut;
      record.totalHours = totalHours;
      record.status = totalHours < 4 ? 'Half-Day' : 'Present';
      record.updatedAt = now;

      return res.status(200).json({
        success: true,
        message: `Checked out successfully at ${formattedCheckOut}. Total hours: ${totalHours} hrs`,
        attendance: record,
      });
    }

    // Mongoose path
    const record = await Attendance.findOne({
      userId,
      date: { $gte: start, $lte: end },
    });

    if (!record || !record.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check out without checking in first today.',
      });
    }

    if (record.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked out today at ' + record.checkOutTime,
        attendance: record,
      });
    }

    const totalHours = calculateHours(record.checkInTime, now);
    record.checkOutTime = formattedCheckOut;
    record.totalHours = totalHours;
    record.status = totalHours < 4 ? 'Half-Day' : 'Present';
    await record.save();

    return res.status(200).json({
      success: true,
      message: `Checked out successfully at ${formattedCheckOut}. Total hours: ${totalHours} hrs`,
      attendance: record,
    });
  } catch (error) {
    console.error('Check-out error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record check-out',
      error: error.message,
    });
  }
};

// @desc    Get current user attendance history
// @route   GET /api/attendance/my-attendance
// @access  Private
export const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user._id;

    if (isUsingInMemory()) {
      const records = inMemoryDB.attendance
        .filter((a) => a.userId.toString() === userId.toString())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Summary statistics
      const presentCount = records.filter((r) => r.status === 'Present').length;
      const halfDayCount = records.filter((r) => r.status === 'Half-Day').length;
      const leaveCount = records.filter((r) => r.status === 'On-Leave').length;
      const totalHours = records.reduce((sum, r) => sum + (r.totalHours || 0), 0);

      return res.status(200).json({
        success: true,
        stats: {
          presentCount,
          halfDayCount,
          leaveCount,
          totalHours: Math.round(totalHours * 10) / 10,
        },
        attendance: records,
      });
    }

    const records = await Attendance.find({ userId }).sort({ date: -1 });
    const presentCount = records.filter((r) => r.status === 'Present').length;
    const halfDayCount = records.filter((r) => r.status === 'Half-Day').length;
    const leaveCount = records.filter((r) => r.status === 'On-Leave').length;
    const totalHours = records.reduce((sum, r) => sum + (r.totalHours || 0), 0);

    return res.status(200).json({
      success: true,
      stats: {
        presentCount,
        halfDayCount,
        leaveCount,
        totalHours: Math.round(totalHours * 10) / 10,
      },
      attendance: records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance logs',
      error: error.message,
    });
  }
};

// @desc    Get all attendance (HR all, Manager team)
// @route   GET /api/attendance/all
// @access  Private (HR & Manager)
export const getAllAttendance = async (req, res) => {
  try {
    const isHr = req.user.role === 'HR';
    const isManager = req.user.role === 'Manager';
    const { date, status, department } = req.query;

    if (isUsingInMemory()) {
      let records = inMemoryDB.attendance.map((att) => {
        const user = inMemoryDB.users.find(
          (u) => u._id.toString() === att.userId.toString()
        );
        return {
          ...att,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                email: user.email,
                department: user.department,
                position: user.position,
                managerId: user.managerId,
              }
            : null,
        };
      });

      // Filter by role scope
      if (isManager && !isHr) {
        records = records.filter(
          (r) =>
            r.user &&
            (r.user.managerId?.toString() === req.user._id.toString() ||
              r.userId.toString() === req.user._id.toString())
        );
      }

      if (date) {
        const targetDate = new Date(date).toISOString().split('T')[0];
        records = records.filter(
          (r) => new Date(r.date).toISOString().split('T')[0] === targetDate
        );
      }

      if (status) {
        records = records.filter((r) => r.status === status);
      }

      if (department) {
        records = records.filter(
          (r) => r.user && r.user.department.toLowerCase() === department.toLowerCase()
        );
      }

      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return res.status(200).json({
        success: true,
        count: records.length,
        attendance: records,
      });
    }

    // Mongoose path
    const filter = {};
    if (status) filter.status = status;
    if (date) {
      const d = new Date(date);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      filter.date = { $gte: start, $lte: end };
    }

    let records = await Attendance.find(filter)
      .populate('userId', 'name email department position managerId')
      .sort({ date: -1 });

    if (isManager && !isHr) {
      records = records.filter(
        (r) =>
          r.userId &&
          (r.userId.managerId?.toString() === req.user._id.toString() ||
            r.userId._id.toString() === req.user._id.toString())
      );
    }

    if (department) {
      records = records.filter(
        (r) => r.userId && r.userId.department.toLowerCase() === department.toLowerCase()
      );
    }

    const formatted = records.map((r) => ({
      ...r.toObject(),
      user: r.userId,
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      attendance: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance logs',
      error: error.message,
    });
  }
};

// @desc    Get status of today's attendance for current user
// @route   GET /api/attendance/today
// @access  Private
export const getTodayStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { start, end } = getTodayRange();

    if (isUsingInMemory()) {
      const record = inMemoryDB.attendance.find(
        (a) =>
          a.userId.toString() === userId.toString() &&
          new Date(a.date) >= start &&
          new Date(a.date) <= end
      );

      return res.status(200).json({
        success: true,
        todayAttendance: record || null,
        isCheckedIn: Boolean(record && record.checkInTime),
        isCheckedOut: Boolean(record && record.checkOutTime),
      });
    }

    const record = await Attendance.findOne({
      userId,
      date: { $gte: start, $lte: end },
    });

    return res.status(200).json({
      success: true,
      todayAttendance: record || null,
      isCheckedIn: Boolean(record && record.checkInTime),
      isCheckedOut: Boolean(record && record.checkOutTime),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve today status',
      error: error.message,
    });
  }
};
