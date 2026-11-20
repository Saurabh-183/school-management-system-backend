import { User } from '../models/user.model.js';
import { Teacher } from '../models/teacher.model.js';
import { Session } from '../models/session.model.js';
import { SESSION_STATUS, ROLES } from '../constants/index.js';

export interface SeedResult {
  success: boolean;
  message: string;
  counts: {
    superAdmins: number;
    admins: number;
    teachers: number;
    users: number;
    sessions: number;
  };
  demoAccounts: Array<{
    name: string;
    role: string;
    email: string;
    organization?: string;
  }>;
  credentialsSummary: string;
}

export const runSeed = async (forceClear = false): Promise<SeedResult> => {
  const existingCount = await User.countDocuments();

  if (!forceClear && existingCount > 0) {
    return {
      success: true,
      message: `Database already contains ${existingCount} users. Auto-seed skipped.`,
      counts: {
        superAdmins: await User.countDocuments({ role: ROLES.SUPER_ADMIN }),
        admins: await User.countDocuments({ role: ROLES.ADMIN }),
        teachers: await Teacher.countDocuments(),
        users: existingCount,
        sessions: await Session.countDocuments(),
      },
      demoAccounts: [
        { name: 'Saurabh Agnihotri (Super Admin)', role: 'SUPER_ADMIN', email: 'superadmin@gmail.com', organization: 'Central Admin Council' },
        { name: 'Prince Agnihotri (School Admin)', role: 'ADMIN', email: 'prince.agnihotri@example.com', organization: 'Delhi Public School (DPS Campus)' },
        { name: 'Abhishek Singh', role: 'TEACHER', email: 'abhishek.singh@example.com', organization: 'Delhi Public School (DPS Campus)' },
        { name: 'Manas Tiwari', role: 'TEACHER', email: 'manas.tiwari@example.com', organization: 'Delhi Public School (DPS Campus)' },
        { name: 'Saurabh Agnihotri', role: 'STUDENT', email: 'saurabh.agnihotri@example.com', organization: 'Delhi Public School (DPS Campus)' },
        { name: 'Anjali Verma', role: 'STUDENT', email: 'anjali.verma@example.com', organization: 'Delhi Public School (DPS Campus)' },
      ],
      credentialsSummary: 'Super Admin: superadmin@gmail.com / #*Saurabh8737@ | All other demo accounts: Password@123',
    };
  }

  // Clear existing collections if forced or if empty
  await Promise.all([
    User.deleteMany({}),
    Teacher.deleteMany({}),
    Session.deleteMany({}),
  ]);

  const schoolOrg = 'Delhi Public School (DPS Campus)';

  // 1. Create Teachers
  const teachers = await Teacher.create([
    {
      fullName: 'Abhishek Singh',
      email: 'abhishek.singh@example.com',
      specialization: 'Full Stack Web Development & Node.js',
      experience: 8,
      organization: schoolOrg,
      assignedClasses: ['Class 11-A', 'Class 12-A'],
    },
    {
      fullName: 'Manas Tiwari',
      email: 'manas.tiwari@example.com',
      specialization: 'Data Structures & Algorithms',
      experience: 6,
      organization: schoolOrg,
      assignedClasses: ['Class 10-B', 'Class 12-A'],
    },
    {
      fullName: 'Saurabh Agnihotri',
      email: 'saurabh.mentor@example.com',
      specialization: 'System Architecture & Cloud Backend',
      experience: 10,
      organization: schoolOrg,
      assignedClasses: ['Class 12-A'],
    },
  ]);

  // 2. Create Users with Passwords and Roles (Super Admin, School Admin, Teachers, Students)
  const defaultPassword = 'Password@123';
  const superAdminPassword = '#*Saurabh8737@';

  const users = await User.create([
    // A. The ONE Super Admin (Platform Owner)
    {
      fullName: 'Saurabh Agnihotri (Super Admin)',
      email: 'superadmin@gmail.com',
      phone: '+919876543200',
      password: superAdminPassword,
      role: ROLES.SUPER_ADMIN,
      organization: 'Mentora Central Education Council',
      classGrade: 'System Super Admin',
    },
    // B. Organization / School Admin
    {
      fullName: 'Prince Agnihotri',
      email: 'prince.agnihotri@example.com',
      phone: '+919876543212',
      password: defaultPassword,
      role: ROLES.ADMIN,
      organization: schoolOrg,
      classGrade: 'Head of Administration',
    },
    // C. Teachers
    {
      fullName: 'Abhishek Singh',
      email: 'abhishek.singh@example.com',
      phone: '+919876543213',
      password: defaultPassword,
      role: ROLES.TEACHER,
      teacherId: teachers[0]._id,
      organization: schoolOrg,
      classGrade: 'Senior Mentor',
    },
    {
      fullName: 'Manas Tiwari',
      email: 'manas.tiwari@example.com',
      phone: '+919876543214',
      password: defaultPassword,
      role: ROLES.TEACHER,
      teacherId: teachers[1]._id,
      organization: schoolOrg,
      classGrade: 'Senior Mentor',
    },
    // D. Students
    {
      fullName: 'Saurabh Agnihotri',
      email: 'saurabh.agnihotri@example.com',
      phone: '+919876543210',
      password: defaultPassword,
      role: ROLES.STUDENT,
      organization: schoolOrg,
      classGrade: 'Class 12-A',
    },
    {
      fullName: 'Anjali Verma',
      email: 'anjali.verma@example.com',
      phone: '+919876543211',
      password: defaultPassword,
      role: ROLES.STUDENT,
      organization: schoolOrg,
      classGrade: 'Class 12-A',
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

  const sessions = await Session.create([
    {
      teacherId: teachers[0]._id, // Abhishek Singh
      userId: users[4]._id,       // Saurabh Agnihotri (Student)
      startTime: today9am,
      endTime: today10am,
      status: SESSION_STATUS.COMPLETED,
      completedAt: new Date(today10am),
    },
    {
      teacherId: teachers[1]._id, // Manas Tiwari
      userId: users[4]._id,       // Saurabh Agnihotri (Student)
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
  ]);

  return {
    success: true,
    message: 'Database seeded successfully with Super Admin, School Admin, Teachers, Students, and Sessions!',
    counts: {
      superAdmins: 1,
      admins: 1,
      teachers: teachers.length,
      users: users.length,
      sessions: sessions.length,
    },
    demoAccounts: [
      { name: 'Saurabh Agnihotri (Super Admin)', role: 'SUPER_ADMIN', email: 'superadmin@gmail.com', organization: 'Central Admin Council' },
      { name: 'Prince Agnihotri (School Admin)', role: 'ADMIN', email: 'prince.agnihotri@example.com', organization: schoolOrg },
      { name: 'Abhishek Singh', role: 'TEACHER', email: 'abhishek.singh@example.com', organization: schoolOrg },
      { name: 'Manas Tiwari', role: 'TEACHER', email: 'manas.tiwari@example.com', organization: schoolOrg },
      { name: 'Saurabh Agnihotri', role: 'STUDENT', email: 'saurabh.agnihotri@example.com', organization: schoolOrg },
      { name: 'Anjali Verma', role: 'STUDENT', email: 'anjali.verma@example.com', organization: schoolOrg },
    ],
    credentialsSummary: 'Super Admin: superadmin@gmail.com / #*Saurabh8737@ | All other demo accounts: Password@123',
  };
};
