import Training from '../models/Training.js';
import User from '../models/User.js';
import { inMemoryDB, isUsingInMemory } from '../config/db.js';

// @desc    Get trainings assigned to current user
// @route   GET /api/training/my-trainings
// @access  Private
export const getMyTrainings = async (req, res) => {
  try {
    const userId = req.user._id;

    if (isUsingInMemory()) {
      const trainings = inMemoryDB.trainings
        .filter((t) =>
          t.assignedTo.some((id) => id.toString() === userId.toString())
        )
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      return res.status(200).json({
        success: true,
        count: trainings.length,
        trainings,
      });
    }

    const trainings = await Training.find({
      assignedTo: userId,
    }).sort({ dueDate: 1 });

    return res.status(200).json({
      success: true,
      count: trainings.length,
      trainings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your training modules',
      error: error.message,
    });
  }
};

// @desc    Get all training programs (HR & Manager)
// @route   GET /api/training/all
// @access  Private (HR & Manager)
export const getAllTrainings = async (req, res) => {
  try {
    const isHr = req.user.role === 'HR';
    const isManager = req.user.role === 'Manager';
    const { department, status } = req.query;

    if (isUsingInMemory()) {
      let list = inMemoryDB.trainings.map((t) => {
        const assignedUsers = inMemoryDB.users
          .filter((u) => t.assignedTo.some((aid) => aid.toString() === u._id.toString()))
          .map((u) => ({
            _id: u._id,
            name: u.name,
            email: u.email,
            department: u.department,
          }));

        return {
          ...t,
          assignedUsers,
        };
      });

      if (department) {
        list = list.filter(
          (t) =>
            t.department.toLowerCase() === department.toLowerCase() ||
            t.department.toLowerCase() === 'all'
        );
      }

      if (status) {
        list = list.filter((t) => t.status === status);
      }

      return res.status(200).json({
        success: true,
        count: list.length,
        trainings: list,
      });
    }

    let filter = {};
    if (department) {
      filter.$or = [{ department }, { department: 'All' }];
    }
    if (status) {
      filter.status = status;
    }

    const trainings = await Training.find(filter)
      .populate('assignedTo', 'name email department')
      .sort({ dueDate: 1 });

    const formatted = trainings.map((t) => ({
      ...t.toObject(),
      assignedUsers: t.assignedTo,
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      trainings: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve trainings',
      error: error.message,
    });
  }
};

// @desc    Create or assign training program
// @route   POST /api/training/assign
// @access  Private (HR & Manager)
export const assignTraining = async (req, res) => {
  try {
    const { title, description, department, assignedTo, dueDate } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Title and due date are required',
      });
    }

    let assignedArray = [];
    if (Array.isArray(assignedTo)) {
      assignedArray = assignedTo;
    } else if (assignedTo) {
      assignedArray = [assignedTo];
    }

    if (isUsingInMemory()) {
      // If department specified and no specific assignedTo, assign to all members of department
      if (assignedArray.length === 0 && department && department !== 'All') {
        assignedArray = inMemoryDB.users
          .filter((u) => u.department.toLowerCase() === department.toLowerCase())
          .map((u) => u._id);
      } else if (assignedArray.length === 0) {
        assignedArray = inMemoryDB.users.map((u) => u._id);
      }

      const newTraining = {
        _id: '67c1c' + Math.floor(1000000000000000000 + Math.random() * 9000000000000000000).toString(16).substring(0, 19),
        title: title.trim(),
        description: description || '',
        department: department || 'All',
        assignedTo: assignedArray,
        dueDate: new Date(dueDate),
        status: 'Upcoming',
        createdAt: new Date(),
      };

      inMemoryDB.trainings.unshift(newTraining);

      return res.status(201).json({
        success: true,
        message: 'Training program created and assigned successfully',
        training: newTraining,
      });
    }

    // Mongoose path
    if (assignedArray.length === 0 && department && department !== 'All') {
      const usersInDept = await User.find({ department }).select('_id');
      assignedArray = usersInDept.map((u) => u._id);
    } else if (assignedArray.length === 0) {
      const allUsers = await User.find().select('_id');
      assignedArray = allUsers.map((u) => u._id);
    }

    const training = await Training.create({
      title: title.trim(),
      description: description || '',
      department: department || 'All',
      assignedTo: assignedArray,
      dueDate: new Date(dueDate),
      status: 'Upcoming',
    });

    return res.status(201).json({
      success: true,
      message: 'Training program created and assigned successfully',
      training,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to assign training',
      error: error.message,
    });
  }
};

// @desc    Update training progress / status
// @route   PUT /api/training/:id/status
// @access  Private (Assigned users, HR, or Manager)
export const updateTrainingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Upcoming', 'In-Progress', 'Completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Upcoming, In-Progress, or Completed',
      });
    }

    if (isUsingInMemory()) {
      const training = inMemoryDB.trainings.find(
        (t) => t._id.toString() === id.toString()
      );
      if (!training) {
        return res.status(404).json({ success: false, message: 'Training not found' });
      }

      training.status = status;
      return res.status(200).json({
        success: true,
        message: `Training status updated to ${status}`,
        training,
      });
    }

    const training = await Training.findById(id);
    if (!training) {
      return res.status(404).json({ success: false, message: 'Training not found' });
    }

    training.status = status;
    await training.save();

    return res.status(200).json({
      success: true,
      message: `Training status updated to ${status}`,
      training,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update training status',
      error: error.message,
    });
  }
};
