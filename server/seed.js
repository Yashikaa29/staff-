import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Attendance from './models/Attendance.js';
import Leave from './models/Leave.js';
import Announcement from './models/Announcement.js';
import Training from './models/Training.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/staffsync';

const seedDatabase = async () => {
  try {
    console.log(`Connecting to MongoDB at: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected. Clearing existing collections...');

    await User.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});
    await Announcement.deleteMany({});
    await Training.deleteMany({});

    console.log('Existing collections cleared.');

    const defaultPassword = 'password123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 1. Seed Users
    const users = await User.create([
      {
        name: 'Sarah Jenkins',
        email: 'hr@staffsync.com',
        password: hashedPassword,
        role: 'HR',
        department: 'Human Resources',
        position: 'VP of People & Culture',
        phone: '+1 (555) 234-5678',
        joiningDate: new Date('2022-03-01'),
        status: 'Active',
      },
      {
        name: 'David Zhao',
        email: 'manager@staffsync.com',
        password: hashedPassword,
        role: 'Manager',
        department: 'Engineering',
        position: 'Engineering Lead',
        phone: '+1 (555) 345-6789',
        joiningDate: new Date('2022-08-15'),
        status: 'Active',
      },
      {
        name: 'Alex Rivera',
        email: 'employee@staffsync.com',
        password: hashedPassword,
        role: 'Employee',
        department: 'Engineering',
        position: 'Senior Full Stack Engineer',
        phone: '+1 (555) 456-7890',
        joiningDate: new Date('2023-01-10'),
        status: 'Active',
      },
      {
        name: 'Elena Rostova',
        email: 'elena.r@staffsync.com',
        password: hashedPassword,
        role: 'Employee',
        department: 'Product Design',
        position: 'Staff UX Designer',
        phone: '+1 (555) 567-8901',
        joiningDate: new Date('2023-04-12'),
        status: 'Active',
      },
      {
        name: 'Marcus Vance',
        email: 'marcus.v@staffsync.com',
        password: hashedPassword,
        role: 'Employee',
        department: 'Marketing',
        position: 'Content & SEO Strategist',
        phone: '+1 (555) 678-9012',
        joiningDate: new Date('2023-09-01'),
        status: 'Active',
      },
    ]);

    const hrUser = users[0];
    const managerUser = users[1];
    const employeeUser = users[2];
    const employee2 = users[3];
    const employee3 = users[4];

    // Link manager
    employeeUser.managerId = managerUser._id;
    await employeeUser.save();
    employee2.managerId = managerUser._id;
    await employee2.save();

    console.log(`Created ${users.length} users successfully.`);

    // 2. Seed Attendance
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    const twoDaysAgo = new Date(Date.now() - 172800000);

    await Attendance.create([
      {
        userId: employeeUser._id,
        date: today,
        checkInTime: '09:05 AM',
        checkOutTime: null,
        totalHours: 0,
        status: 'Present',
      },
      {
        userId: employeeUser._id,
        date: yesterday,
        checkInTime: '08:55 AM',
        checkOutTime: '05:30 PM',
        totalHours: 8.5,
        status: 'Present',
      },
      {
        userId: employeeUser._id,
        date: twoDaysAgo,
        checkInTime: '09:10 AM',
        checkOutTime: '05:10 PM',
        totalHours: 8,
        status: 'Present',
      },
      {
        userId: managerUser._id,
        date: today,
        checkInTime: '08:45 AM',
        checkOutTime: null,
        totalHours: 0,
        status: 'Present',
      },
      {
        userId: hrUser._id,
        date: today,
        checkInTime: '09:00 AM',
        checkOutTime: null,
        totalHours: 0,
        status: 'Present',
      },
    ]);

    console.log('Created sample attendance records.');

    // 3. Seed Leaves
    await Leave.create([
      {
        userId: employeeUser._id,
        leaveType: 'Annual',
        startDate: new Date(Date.now() + 86400000 * 5),
        endDate: new Date(Date.now() + 86400000 * 8),
        reason: 'Family holiday travel and recharge.',
        status: 'Pending',
      },
      {
        userId: employee2._id,
        leaveType: 'Sick',
        startDate: new Date(Date.now() - 86400000 * 7),
        endDate: new Date(Date.now() - 86400000 * 6),
        reason: 'Severe migraine recovery.',
        status: 'Approved',
        reviewedBy: managerUser._id,
        reviewComments: 'Approved. Rest well!',
      },
      {
        userId: employee3._id,
        leaveType: 'Casual',
        startDate: new Date(Date.now() + 86400000 * 12),
        endDate: new Date(Date.now() + 86400000 * 13),
        reason: 'Attending wedding ceremony out of town.',
        status: 'Pending',
      },
    ]);

    console.log('Created sample leave records.');

    // 4. Seed Announcements
    await Announcement.create([
      {
        title: 'StaffSync Annual Global Offsite 2026',
        content: 'We are thrilled to announce our upcoming company-wide retreat in Lake Tahoe, CA! Join us for team bonding, strategy workshops, and relaxation. Details on flights and accommodations will be sent individually.',
        priority: 'High',
        category: 'Company Event',
        authorId: hrUser._id,
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        title: 'Q4 Performance Review & Growth Check-Ins',
        content: 'Self-reviews and 360 peer feedback submissions are now open in the portal. Please complete your evaluations by the 25th of this month.',
        priority: 'Medium',
        category: 'Operations',
        authorId: hrUser._id,
        createdAt: new Date(Date.now() - 86400000 * 3),
      },
      {
        title: 'Health & Wellness Benefit Expansion',
        content: 'Good news! Our wellness allowance has been boosted to $150/month covering gym memberships, mental health apps, and athletic gear. Claim through expense receipts.',
        priority: 'Low',
        category: 'Benefits',
        authorId: hrUser._id,
        createdAt: new Date(Date.now() - 86400000 * 7),
      },
    ]);

    console.log('Created sample announcements.');

    // 5. Seed Trainings
    await Training.create([
      {
        title: 'Cybersecurity & Phishing Defense 2026',
        description: 'Mandatory annual training covering zero-trust security, credential hygiene, and phishing simulation drills.',
        department: 'All',
        assignedTo: [employeeUser._id, employee2._id, employee3._id, managerUser._id],
        dueDate: new Date(Date.now() + 86400000 * 14),
        status: 'In-Progress',
      },
      {
        title: 'Microservices & Distributed Systems in Node.js',
        description: 'Advanced technical architecture modules detailing event-driven patterns, Redis caching, and resilient APIs.',
        department: 'Engineering',
        assignedTo: [employeeUser._id],
        dueDate: new Date(Date.now() + 86400000 * 25),
        status: 'Upcoming',
      },
      {
        title: 'Managerial Empathy & Effective 1-on-1s',
        description: 'Essential workshop for managers on active listening, psychological safety, and growth conversations.',
        department: 'Engineering',
        assignedTo: [managerUser._id],
        dueDate: new Date(Date.now() + 86400000 * 5),
        status: 'Completed',
      },
    ]);

    console.log('Created sample training modules.');
    console.log('Database Seeding Complete!');
    console.log('---------------------------------------------------------');
    console.log('Demo Accounts:');
    console.log('  HR / Admin : hr@staffsync.com       / password123');
    console.log('  Manager    : manager@staffsync.com  / password123');
    console.log('  Employee   : employee@staffsync.com / password123');
    console.log('---------------------------------------------------------');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
