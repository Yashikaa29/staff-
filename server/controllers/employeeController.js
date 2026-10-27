import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { inMemoryDB, isUsingInMemory } from '../config/db.js';

// @desc    Get all employees with filters
// @route   GET /api/employees
// @access  Private (All authenticated users can view directory, managers filter team)
export const getAllEmployees = async (req, res) => {
  try {
    const { department, role, status, search } = req.query;

    if (isUsingInMemory()) {
      let results = [...inMemoryDB.users];

      if (department) {
        results = results.filter(
          (u) => u.department && u.department.toLowerCase() === department.toLowerCase()
        );
      }
      if (role) {
        results = results.filter((u) => u.role === role);
      }
      if (status) {
        results = results.filter((u) => u.status === status);
      }
      if (search) {
        const query = search.toLowerCase();
        results = results.filter(
          (u) =>
            u.name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            (u.position && u.position.toLowerCase().includes(query)) ||
            (u.department && u.department.toLowerCase().includes(query))
        );
      }

      // If Manager, add a flag isDirectReport
      const sanitized = results.map((u) => {
        const { password, ...rest } = u;
        const manager = inMemoryDB.users.find(
          (m) => m._id.toString() === (u.managerId ? u.managerId.toString() : '')
        );
        return {
          ...rest,
          managerName: manager ? manager.name : 'None',
          isDirectReport: req.user.role === 'Manager' && u.managerId?.toString() === req.user._id?.toString(),
        };
      });

      return res.status(200).json({
        success: true,
        count: sanitized.length,
        employees: sanitized,
      });
    }

    // Mongoose path
    const filter = {};
    if (department) filter.department = department;
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await User.find(filter)
      .select('-password')
      .populate('managerId', 'name email position')
      .sort({ createdAt: -1 });

    const formatted = employees.map((emp) => ({
      ...emp.toObject(),
      managerName: emp.managerId ? emp.managerId.name : 'None',
      isDirectReport: req.user.role === 'Manager' && emp.managerId?._id?.toString() === req.user._id?.toString(),
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      employees: formatted,
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve employees',
      error: error.message,
    });
  }
};

// @desc    Get single employee details
// @route   GET /api/employees/:id
// @access  Private
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isUsingInMemory()) {
      const user = inMemoryDB.users.find((u) => u._id.toString() === id.toString());
      if (!user) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }
      const { password, ...userData } = user;
      const manager = inMemoryDB.users.find(
        (m) => m._id.toString() === (user.managerId ? user.managerId.toString() : '')
      );

      return res.status(200).json({
        success: true,
        employee: {
          ...userData,
          managerName: manager ? manager.name : 'None',
        },
      });
    }

    const employee = await User.findById(id).select('-password').populate('managerId', 'name email');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    return res.status(200).json({
      success: true,
      employee,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching employee',
      error: error.message,
    });
  }
};

// @desc    Create new employee record
// @route   POST /api/employees
// @access  Private (HR only)
export const createEmployee = async (req, res) => {
  try {
    const { name, email, password, role, department, position, phone, managerId, status } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required fields',
      });
    }

    const defaultPassword = password || 'password123';
    const normalizedEmail = email.toLowerCase().trim();

    if (isUsingInMemory()) {
      const exists = inMemoryDB.users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'An employee with this email already exists',
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);

      const newEmp = {
        _id: '67c1c' + Math.floor(1000000000000000000 + Math.random() * 9000000000000000000).toString(16).substring(0, 19),
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: role || 'Employee',
        department: department || 'General',
        position: position || 'Staff Member',
        phone: phone || '',
        joiningDate: new Date(),
        status: status || 'Active',
        managerId: managerId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      inMemoryDB.users.unshift(newEmp);
      const { password: _, ...cleanEmp } = newEmp;

      return res.status(201).json({
        success: true,
        message: 'Employee record created successfully',
        employee: cleanEmp,
      });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'An employee with this email already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const employee = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role || 'Employee',
      department: department || 'General',
      position: position || 'Staff Member',
      phone: phone || '',
      managerId: managerId || null,
      status: status || 'Active',
    });

    const userObj = employee.toObject();
    delete userObj.password;

    return res.status(201).json({
      success: true,
      message: 'Employee record created successfully',
      employee: userObj,
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating employee',
      error: error.message,
    });
  }
};

// @desc    Update employee details
// @route   PUT /api/employees/:id
// @access  Private (HR can update everything; Employee can update personal contact)
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const isHr = req.user.role === 'HR';
    const isSelf = req.user._id.toString() === id.toString();

    if (!isHr && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only edit your own profile',
      });
    }

    if (isUsingInMemory()) {
      const index = inMemoryDB.users.findIndex((u) => u._id.toString() === id.toString());
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      const existing = inMemoryDB.users[index];

      // If HR, update all fields; if Self, only allow phone/emergency
      if (isHr) {
        if (req.body.name) existing.name = req.body.name;
        if (req.body.role) existing.role = req.body.role;
        if (req.body.department) existing.department = req.body.department;
        if (req.body.position) existing.position = req.body.position;
        if (req.body.phone !== undefined) existing.phone = req.body.phone;
        if (req.body.status) existing.status = req.body.status;
        if (req.body.managerId !== undefined) existing.managerId = req.body.managerId;
        if (req.body.password) {
          const salt = await bcrypt.genSalt(10);
          existing.password = await bcrypt.hash(req.body.password, salt);
        }
      } else {
        if (req.body.phone !== undefined) existing.phone = req.body.phone;
        if (req.body.name) existing.name = req.body.name;
      }

      existing.updatedAt = new Date();
      inMemoryDB.users[index] = existing;

      const { password, ...userData } = existing;
      return res.status(200).json({
        success: true,
        message: 'Employee updated successfully',
        employee: userData,
      });
    }

    // Mongoose path
    const employee = await User.findById(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (isHr) {
      const allowedFields = ['name', 'role', 'department', 'position', 'phone', 'status', 'managerId'];
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) employee[field] = req.body[field];
      });
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        employee.password = await bcrypt.hash(req.body.password, salt);
      }
    } else {
      if (req.body.phone !== undefined) employee.phone = req.body.phone;
      if (req.body.name) employee.name = req.body.name;
    }

    await employee.save();
    const cleanObj = employee.toObject();
    delete cleanObj.password;

    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      employee: cleanObj,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating employee',
      error: error.message,
    });
  }
};

// @desc    Delete employee record
// @route   DELETE /api/employees/:id
// @access  Private (HR only)
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() === id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    if (isUsingInMemory()) {
      const index = inMemoryDB.users.findIndex((u) => u._id.toString() === id.toString());
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      inMemoryDB.users.splice(index, 1);
      return res.status(200).json({
        success: true,
        message: 'Employee record deleted successfully',
      });
    }

    const employee = await User.findByIdAndDelete(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Employee record deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting employee',
      error: error.message,
    });
  }
};
