import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

let isConnected = false;
let isInMemoryFallback = false;

// In-Memory store for preview environments when external MongoDB is not reachable
export const inMemoryDB = {
  users: [],
  attendance: [],
  leaves: [],
  announcements: [],
  trainings: [],
};

export const initializeInMemoryData = async () => {
  if (inMemoryDB.users.length > 0) return; // already initialized

  const hashedPassword = await bcrypt.hash('password123', 10);
  const now = new Date();

  // Initial Demo Users
  const hrUser = {
    _id: '67c1c0000000000000000001',
    name: 'Sarah Jenkins',
    email: 'hr@staffsync.com',
    password: hashedPassword,
    role: 'HR',
    department: 'Human Resources',
    position: 'Chief People Officer',
    phone: '+1 (555) 234-5678',
    joiningDate: new Date('2023-01-15'),
    status: 'Active',
    managerId: null,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date(),
  };

  const managerUser = {
    _id: '67c1c0000000000000000002',
    name: 'David Zhao',
    email: 'manager@staffsync.com',
    password: hashedPassword,
    role: 'Manager',
    department: 'Engineering',
    position: 'Engineering Director',
    phone: '+1 (555) 345-6789',
    joiningDate: new Date('2023-03-01'),
    status: 'Active',
    managerId: hrUser._id,
    createdAt: new Date('2023-03-01'),
    updatedAt: new Date(),
  };

  const employeeUser = {
    _id: '67c1c0000000000000000003',
    name: 'Alex Rivera',
    email: 'employee@staffsync.com',
    password: hashedPassword,
    role: 'Employee',
    department: 'Engineering',
    position: 'Full Stack Engineer',
    phone: '+1 (555) 456-7890',
    joiningDate: new Date('2023-06-10'),
    status: 'Active',
    managerId: managerUser._id,
    createdAt: new Date('2023-06-10'),
    updatedAt: new Date(),
  };

  const employee2 = {
    _id: '67c1c0000000000000000004',
    name: 'Emily Watson',
    email: 'emily.w@staffsync.com',
    password: hashedPassword,
    role: 'Employee',
    department: 'Design & Product',
    position: 'Senior Product Designer',
    phone: '+1 (555) 789-0123',
    joiningDate: new Date('2023-08-20'),
    status: 'Active',
    managerId: managerUser._id,
    createdAt: new Date('2023-08-20'),
    updatedAt: new Date(),
  };

  const employee3 = {
    _id: '67c1c0000000000000000005',
    name: 'Marcus Vance',
    email: 'marcus.v@staffsync.com',
    password: hashedPassword,
    role: 'Employee',
    department: 'Marketing',
    position: 'Growth Lead',
    phone: '+1 (555) 890-1234',
    joiningDate: new Date('2024-02-01'),
    status: 'Active',
    managerId: null,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
  };

  inMemoryDB.users = [hrUser, managerUser, employeeUser, employee2, employee3];

  // Attendance Records
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const dayBefore = new Date(Date.now() - 172800000).toISOString().split('T')[0];

  inMemoryDB.attendance = [
    {
      _id: '67c1c1000000000000000001',
      userId: employeeUser._id,
      date: new Date(todayStr),
      checkInTime: '09:05 AM',
      checkOutTime: null,
      totalHours: 0,
      status: 'Present',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: '67c1c1000000000000000002',
      userId: employeeUser._id,
      date: new Date(yesterday),
      checkInTime: '08:58 AM',
      checkOutTime: '05:30 PM',
      totalHours: 8.5,
      status: 'Present',
      createdAt: new Date(yesterday),
      updatedAt: new Date(yesterday),
    },
    {
      _id: '67c1c1000000000000000003',
      userId: employeeUser._id,
      date: new Date(dayBefore),
      checkInTime: '09:15 AM',
      checkOutTime: '05:15 PM',
      totalHours: 8,
      status: 'Present',
      createdAt: new Date(dayBefore),
      updatedAt: new Date(dayBefore),
    },
    {
      _id: '67c1c1000000000000000004',
      userId: managerUser._id,
      date: new Date(todayStr),
      checkInTime: '08:45 AM',
      checkOutTime: null,
      totalHours: 0,
      status: 'Present',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: '67c1c1000000000000000005',
      userId: hrUser._id,
      date: new Date(todayStr),
      checkInTime: '09:00 AM',
      checkOutTime: null,
      totalHours: 0,
      status: 'Present',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Leave records
  inMemoryDB.leaves = [
    {
      _id: '67c1c2000000000000000001',
      userId: employeeUser._id,
      leaveType: 'Annual',
      startDate: new Date(Date.now() + 86400000 * 5),
      endDate: new Date(Date.now() + 86400000 * 8),
      reason: 'Family vacation and personal downtime.',
      status: 'Pending',
      reviewedBy: null,
      reviewComments: '',
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(Date.now() - 86400000),
    },
    {
      _id: '67c1c2000000000000000002',
      userId: employee2._id,
      leaveType: 'Sick',
      startDate: new Date(Date.now() - 86400000 * 10),
      endDate: new Date(Date.now() - 86400000 * 9),
      reason: 'Doctor appointment and recovery from seasonal flu.',
      status: 'Approved',
      reviewedBy: managerUser._id,
      reviewComments: 'Approved. Hope you feel better soon!',
      createdAt: new Date(Date.now() - 86400000 * 12),
      updatedAt: new Date(Date.now() - 86400000 * 11),
    },
    {
      _id: '67c1c2000000000000000003',
      userId: employee3._id,
      leaveType: 'Casual',
      startDate: new Date(Date.now() + 86400000 * 14),
      endDate: new Date(Date.now() + 86400000 * 15),
      reason: 'Attending sibling graduation ceremony.',
      status: 'Pending',
      reviewedBy: null,
      reviewComments: '',
      createdAt: new Date(Date.now() - 86400000 * 2),
      updatedAt: new Date(Date.now() - 86400000 * 2),
    },
  ];

  // Announcements
  inMemoryDB.announcements = [
    {
      _id: '67c1c3000000000000000001',
      title: 'Annual Company Retreat 2026 Announced!',
      content: 'We are thrilled to announce our 2026 Company Retreat in Lake Tahoe! Mark your calendars for November 12-16. Travel bookings and accommodation guidelines will be shared next week by HR.',
      priority: 'High',
      category: 'Company Event',
      authorId: hrUser._id,
      createdAt: new Date(Date.now() - 86400000 * 1),
    },
    {
      _id: '67c1c3000000000000000002',
      title: 'Q4 Performance Review Cycle & Goal Setting',
      content: 'The end-of-year review cycle begins on Monday. Managers and direct reports are encouraged to complete self-evaluations and schedule 1-on-1 feedback sessions by mid-month.',
      priority: 'Medium',
      category: 'Operations',
      authorId: hrUser._id,
      createdAt: new Date(Date.now() - 86400000 * 3),
    },
    {
      _id: '67c1c3000000000000000003',
      title: 'New Health & Wellness Stipend Policy',
      content: 'Starting next pay period, all full-time employees are eligible for an increased $150/month gym, wellness, and mental fitness reimbursement. Submit receipts via the portal.',
      priority: 'Low',
      category: 'Benefits',
      authorId: hrUser._id,
      createdAt: new Date(Date.now() - 86400000 * 6),
    },
  ];

  // Trainings
  inMemoryDB.trainings = [
    {
      _id: '67c1c4000000000000000001',
      title: 'Information Security & SOC2 Compliance 2026',
      description: 'Mandatory annual cybersecurity awareness, phishing prevention protocols, and data protection guidelines.',
      department: 'All',
      assignedTo: [employeeUser._id, employee2._id, employee3._id, managerUser._id],
      dueDate: new Date(Date.now() + 86400000 * 12),
      status: 'In-Progress',
      createdAt: new Date(Date.now() - 86400000 * 5),
    },
    {
      _id: '67c1c4000000000000000002',
      title: 'Advanced React & TypeScript Architecture',
      description: 'Internal workshop covering design system integration, state management best practices, and performance tuning.',
      department: 'Engineering',
      assignedTo: [employeeUser._id],
      dueDate: new Date(Date.now() + 86400000 * 20),
      status: 'Upcoming',
      createdAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      _id: '67c1c4000000000000000003',
      title: 'Inclusive Leadership & Constructive Feedback',
      description: 'Leadership workshop for people managers on empathy-driven 1-on-1s and conflict resolution.',
      department: 'Management',
      assignedTo: [managerUser._id],
      dueDate: new Date(Date.now() + 86400000 * 7),
      status: 'Completed',
      createdAt: new Date(Date.now() - 86400000 * 14),
    },
  ];

  console.log('InMemoryDB initialized with demo accounts and data.');
};

export const connectDB = async () => {
  if (isConnected) return;

  const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (mongoURI) {
    try {
      console.log(`Connecting to MongoDB at: ${mongoURI.replace(/:([^:@]{1,})@/, ':****@')}`);
      await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 3000,
      });
      isConnected = true;
      isInMemoryFallback = false;
      console.log('MongoDB connection established successfully.');
      return;
    } catch (err) {
      console.warn('Failed to connect to configured MongoDB URI:', err.message);
      console.warn('Falling back to local in-memory mock storage mode.');
    }
  }

  // Fallback to in-memory store
  isInMemoryFallback = true;
  await initializeInMemoryData();
  console.log('Running in In-Memory DB Mode. All CRUD operations will be persisted in memory.');
};

export const isUsingInMemory = () => isInMemoryFallback;
