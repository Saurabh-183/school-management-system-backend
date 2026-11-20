import { User } from '../models/user.model.js';
import { Teacher } from '../models/teacher.model.js';
import { Session } from '../models/session.model.js';
import { SESSION_STATUS, ROLES } from '../constants/index.js';

export interface SeedResult {
  success: boolean;
  message: string;
  counts: {
    teachers: number;
    users: number;
    sessions: number;
  };
  demoAccounts: Array<{
    name: string;
    role: string;
    email: string;
  }>;
  defaultPassword: string;
}

export const runSeed = async (forceClear = false): Promise<SeedResult> => {
  const existingCount = await User.countDocuments();

  if (!forceClear && existingCount > 0) {
    return {
      success: true,
      message: `Database already contains ${existingCount} users. Auto-seed skipped.`,
      counts: {
        teachers: await Teacher.countDocuments(),
        users: existingCount,
        sessions: await Session.countDocuments(),
      },
      demoAccounts: [
        { name: 'Saurabh Agnihotri', role: 'STUDENT', email: 'saurabh.agnihotri@example.com' },
        { name: 'Anjali Verma', role: 'STUDENT', email: 'anjali.verma@example.com' },
        { name: 'Abhishek Singh', role: 'TEACHER', email: 'abhishek.singh@example.com' },
        { name: 'Manas Tiwari', role: 'TEACHER', email: 'manas.tiwari@example.com' },
        { name: 'Prince Agnihotri', role: 'ADMIN', email: 'prince.agnihotri@example.com' },
      ],
      defaultPassword: 'Password@123',
    };
  }

  // Clear existing collections if forced or if empty
  await Promise.all([
    User.deleteMany({}),
    Teacher.deleteMany({}),
    Session.deleteMany({}),
  ]);

  // 1. Create Teachers
  const teachers = await Teacher.create([
    {
      fullName: 'Abhishek Singh',
      email: 'abhishek.singh@example.com',
      specialization: 'Full Stack Web Development & Node.js',
      experience: 8,
    },
    {
      fullName: 'Manas Tiwari',
      email: 'manas.tiwari@example.com',
      specialization: 'Data Structures & Algorithms',
      experience: 6,
    },
    {
      fullName: 'Saurabh Agnihotri',
      email: 'saurabh.mentor@example.com',
      specialization: 'System Architecture & Cloud Backend',
      experience: 10,
    },
  ]);

  // 2. Create Users with Passwords and Roles (RBAC)
  const plainPassword = 'Password@123';

  const users = await User.create([
    {
      fullName: 'Saurabh Agnihotri',
      email: 'saurabh.agnihotri@example.com',
      phone: '+919876543210',
      password: plainPassword,
      role: ROLES.STUDENT,
    },
    {
      fullName: 'Anjali Verma',
      email: 'anjali.verma@example.com',
      phone: '+919876543211',
      password: plainPassword,
      role: ROLES.STUDENT,
    },
    {
      fullName: 'Abhishek Singh',
      email: 'abhishek.singh@example.com',
      phone: '+919876543213',
      password: plainPassword,
      role: ROLES.TEACHER,
      teacherId: teachers[0]._id,
    },
    {
      fullName: 'Manas Tiwari',
      email: 'manas.tiwari@example.com',
      phone: '+919876543214',
      password: plainPassword,
      role: ROLES.TEACHER,
      teacherId: teachers[1]._id,
    },
    {
      fullName: 'Prince Agnihotri',
      email: 'prince.agnihotri@example.com',
      phone: '+919876543212',
      password: plainPassword,
      role: ROLES.ADMIN,
    },
  ]);

  // 3. Create Sessions for Today & Tomorrow dynamically
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const today9am = new Date(today);
  today9am.setUTCHours(9, 0, 0, 0);
  const today10am = new Date(today);
  today10am.setUTCHours(10, 0, 0, 0);

  const today11am = new Date(today);
  today11am.setUTCHours(11, 0, 0, 0);
  const today12pm = new Date(today);
  today12pm.setUTCHours(12, 0, 0, 0);

  const today2pm = new Date(today);
  today2pm.setUTCHours(14, 0, 0, 0);
  const today3pm = new Date(today);
  today3pm.setUTCHours(15, 0, 0, 0);

  const today4pm = new Date(today);
  today4pm.setUTCHours(16, 0, 0, 0);
  const today5pm = new Date(today);
  today5pm.setUTCHours(17, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrow10am = new Date(tomorrow);
  tomorrow10am.setUTCHours(10, 0, 0, 0);
  const tomorrow11am = new Date(tomorrow);
  tomorrow11am.setUTCHours(11, 0, 0, 0);

  const tomorrow2pm = new Date(tomorrow);
  tomorrow2pm.setUTCHours(14, 0, 0, 0);
  const tomorrow3pm = new Date(tomorrow);
  tomorrow3pm.setUTCHours(15, 0, 0, 0);

  const sessions = await Session.create([
    {
      teacherId: teachers[0]._id, // Abhishek Singh
      userId: users[0]._id,       // Saurabh Agnihotri
      startTime: today9am,
      endTime: today10am,
      status: SESSION_STATUS.COMPLETED,
      completedAt: new Date(today10am),
    },
    {
      teacherId: teachers[1]._id, // Manas Tiwari
      userId: users[0]._id,       // Saurabh Agnihotri
      startTime: today11am,
      endTime: today12pm,
      status: SESSION_STATUS.BOOKED,
      completedAt: null,
    },
    {
      teacherId: teachers[0]._id, // Abhishek Singh
      userId: null,
      startTime: today2pm,
      endTime: today3pm,
      status: SESSION_STATUS.AVAILABLE,
      completedAt: null,
    },
    {
      teacherId: teachers[1]._id, // Manas Tiwari
      userId: null,
      startTime: today4pm,
      endTime: today5pm,
      status: SESSION_STATUS.AVAILABLE,
      completedAt: null,
    },
    {
      teacherId: teachers[2]._id, // Saurabh Agnihotri
      userId: null,
      startTime: tomorrow10am,
      endTime: tomorrow11am,
      status: SESSION_STATUS.AVAILABLE,
      completedAt: null,
    },
    {
      teacherId: teachers[0]._id, // Abhishek Singh
      userId: null,
      startTime: tomorrow2pm,
      endTime: tomorrow3pm,
      status: SESSION_STATUS.AVAILABLE,
      completedAt: null,
    },
  ]);

  return {
    success: true,
    message: 'Database seeded successfully with demo users, teachers, and sessions!',
    counts: {
      teachers: teachers.length,
      users: users.length,
      sessions: sessions.length,
    },
    demoAccounts: [
      { name: 'Saurabh Agnihotri', role: 'STUDENT', email: 'saurabh.agnihotri@example.com' },
      { name: 'Anjali Verma', role: 'STUDENT', email: 'anjali.verma@example.com' },
      { name: 'Abhishek Singh', role: 'TEACHER', email: 'abhishek.singh@example.com' },
      { name: 'Manas Tiwari', role: 'TEACHER', email: 'manas.tiwari@example.com' },
      { name: 'Prince Agnihotri', role: 'ADMIN', email: 'prince.agnihotri@example.com' },
    ],
    defaultPassword: 'Password@123',
  };
};
