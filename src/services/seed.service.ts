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

  // 2. Create Users with Passwords, plainPasswords, Creator Hierarchy and Statuses
  const defaultPassword = 'Password@123';
  const superAdminPassword = '#*Saurabh8737@';

  // A. Super Admin
  const superAdminUser = await User.create({
    fullName: 'Saurabh Agnihotri (Super Admin)',
    email: 'superadmin@gmail.com',
    phone: '+919876543200',
    password: superAdminPassword,
    plainPassword: superAdminPassword,
    role: ROLES.SUPER_ADMIN,
    organization: 'Mentora Central Education Council',
    classGrade: 'System Super Admin',
    accountStatus: 'ACTIVE',
    isTrial: false,
    isOnline: true,
    lastLoginAt: new Date(),
    lastActiveAt: new Date(),
    createdByName: 'Root System Initializer',
    createdByRole: 'ROOT',
  });

  // B. School Admin (Created by Super Admin)
  const schoolAdminUser = await User.create({
    fullName: 'Prince Agnihotri',
    email: 'prince.agnihotri@example.com',
    phone: '+919876543212',
    password: defaultPassword,
    plainPassword: defaultPassword,
    role: ROLES.ADMIN,
    organization: schoolOrg,
    classGrade: 'Head of Administration',
    accountStatus: 'ACTIVE',
    isTrial: false,
    isOnline: false,
    lastLoginAt: new Date(Date.now() - 3600000 * 3),
    lastLogoutAt: new Date(Date.now() - 3600000 * 2),
    lastActiveAt: new Date(Date.now() - 3600000 * 2),
    createdBy: superAdminUser._id,
    createdByName: superAdminUser.fullName,
    createdByRole: ROLES.SUPER_ADMIN,
  });

  // C. Teachers (Created by School Admin)
  const teacherUser1 = await User.create({
    fullName: 'Abhishek Singh',
    email: 'abhishek.singh@example.com',
    phone: '+919876543213',
    password: defaultPassword,
    plainPassword: defaultPassword,
    role: ROLES.TEACHER,
    teacherId: teachers[0]._id,
    organization: schoolOrg,
    classGrade: 'Senior Mentor',
    accountStatus: 'ACTIVE',
    isTrial: false,
    isOnline: false,
    lastLoginAt: new Date(Date.now() - 3600000 * 5),
    lastActiveAt: new Date(Date.now() - 3600000 * 4),
    createdBy: schoolAdminUser._id,
    createdByName: schoolAdminUser.fullName,
    createdByRole: ROLES.ADMIN,
  });

  const teacherUser2 = await User.create({
    fullName: 'Manas Tiwari',
    email: 'manas.tiwari@example.com',
    phone: '+919876543214',
    password: defaultPassword,
    plainPassword: defaultPassword,
    role: ROLES.TEACHER,
    teacherId: teachers[1]._id,
    organization: schoolOrg,
    classGrade: 'Senior Mentor',
    accountStatus: 'ACTIVE',
    isTrial: false,
    isOnline: false,
    lastLoginAt: new Date(Date.now() - 3600000 * 6),
    lastActiveAt: new Date(Date.now() - 3600000 * 5),
    createdBy: schoolAdminUser._id,
    createdByName: schoolAdminUser.fullName,
    createdByRole: ROLES.ADMIN,
  });

  // Link teachers in Teacher collection to their admin creator
  await Teacher.updateMany({}, { createdBy: schoolAdminUser._id, createdByName: schoolAdminUser.fullName });

  // D. Students (Created by Teacher Abhishek Singh)
  const studentUser1 = await User.create({
    fullName: 'Saurabh Agnihotri',
    email: 'saurabh.agnihotri@example.com',
    phone: '+919876543210',
    password: defaultPassword,
    plainPassword: defaultPassword,
    role: ROLES.STUDENT,
    organization: schoolOrg,
    classGrade: 'Class 12-A',
    accountStatus: 'ACTIVE',
    isTrial: false,
    isOnline: true,
    lastLoginAt: new Date(Date.now() - 1800000),
    lastActiveAt: new Date(Date.now() - 300000),
    createdBy: teacherUser1._id,
    createdByName: teacherUser1.fullName,
    createdByRole: ROLES.TEACHER,
  });

  const studentUser2 = await User.create({
    fullName: 'Anjali Verma',
    email: 'anjali.verma@example.com',
    phone: '+919876543211',
    password: defaultPassword,
    plainPassword: defaultPassword,
    role: ROLES.STUDENT,
    organization: schoolOrg,
    classGrade: 'Class 12-A',
    accountStatus: 'ACTIVE',
    isTrial: false,
    isOnline: false,
    lastLoginAt: new Date(Date.now() - 3600000 * 8),
    lastActiveAt: new Date(Date.now() - 3600000 * 7),
    createdBy: teacherUser1._id,
    createdByName: teacherUser1.fullName,
    createdByRole: ROLES.TEACHER,
  });

  // E. Trial Student (Active 72-Hour Web Evaluation)
  const trialStudent = await User.create({
    fullName: 'Kavita Sharma',
    email: 'kavita.sharma@example.com',
    phone: '+919876543288',
    password: defaultPassword,
    plainPassword: defaultPassword,
    role: ROLES.STUDENT,
    organization: 'Self-Registered Web Trial',
    classGrade: 'Class 11-B (Trial)',
    accountStatus: 'TRIAL',
    isTrial: true,
    trialExpiresAt: new Date(Date.now() + 48 * 3600 * 1000), // 48 hours left
    isOnline: true,
    lastLoginAt: new Date(Date.now() - 600000),
    lastActiveAt: new Date(),
    createdByName: 'Public Web Portal Self-Registration',
    createdByRole: 'SELF_TRIAL',
  });

  // F. Expired Trial Student
  const expiredStudent = await User.create({
    fullName: 'Rahul Joshi',
    email: 'rahul.joshi@example.com',
    phone: '+919876543299',
    password: defaultPassword,
    plainPassword: defaultPassword,
    role: ROLES.STUDENT,
    organization: 'Self-Registered Web Trial',
    classGrade: 'Class 10-A (Trial)',
    accountStatus: 'EXPIRED',
    isTrial: true,
    trialExpiresAt: new Date(Date.now() - 2 * 3600 * 1000), // Expired 2 hours ago
    isOnline: false,
    lastLoginAt: new Date(Date.now() - 75 * 3600 * 1000),
    lastLogoutAt: new Date(Date.now() - 74 * 3600 * 1000),
    createdByName: 'Public Web Portal Self-Registration',
    createdByRole: 'SELF_TRIAL',
  });

  const users = [
    superAdminUser,
    schoolAdminUser,
    teacherUser1,
    teacherUser2,
    studentUser1,
    studentUser2,
    trialStudent,
    expiredStudent,
  ];

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
      notes: [
        {
          title: 'Advanced Data Structures: Binary Search Trees & AVL Rotations',
          content: '### Core Academic Summary:\n1. **Binary Search Tree Property**: For every node $X$, all keys in the left subtree are $< X$, and all keys in the right subtree are $> X$.\n2. **AVL Rebalancing**: Calculated via Balance Factor `BF = height(left) - height(right)`. If `|BF| > 1`, invoke Single (LL, RR) or Double (LR, RL) rotations.\n3. **Practical Exam Takeaways**: In-order traversal of a BST yields elements in monotonically increasing sorted order.',
          authorName: 'Abhishek Singh',
          createdAt: new Date(today10am),
        },
      ],
      videoLectures: [
        {
          title: 'Class 12-A Masterclass: Tree Traversals & Recursion Demystified',
          videoUrl: 'https://www.youtube-nocookie.com/embed/gcULXE7ViZw',
          duration: '48 mins',
          description: 'Live whiteboard lecture recording covering recursive stack traces, rotation mechanics, and time complexities.',
          uploadedAt: new Date(today9am),
        },
      ],
      documents: [
        {
          title: 'Class_12A_Data_Structures_Lecture_Notes_Unit_3.pdf',
          fileUrl: 'https://arxiv.org/pdf/math/0211159.pdf',
          fileType: 'PDF',
          fileSize: '2.8 MB',
          uploadedAt: new Date(today9am),
        },
      ],
    },
    {
      teacherId: teachers[1]._id, // Manas Tiwari
      userId: users[4]._id,       // Saurabh Agnihotri (Student)
      startTime: today11am,
      endTime: today12pm,
      status: SESSION_STATUS.BOOKED,
      completedAt: null,
      notes: [
        {
          title: 'System Architecture: High-Throughput Node.js Microservices',
          content: '### Session Highlights:\n- Event loop phases: Timers, Pending I/O callbacks, Idle/Prepare, Poll, Check (setImmediate), Close.\n- Microtask queues: `process.nextTick` executes before Promise microtasks.\n- Clustering & horizontal scaling with PM2 and containerization.',
          authorName: 'Manas Tiwari',
          createdAt: new Date(today11am),
        },
      ],
      videoLectures: [
        {
          title: 'System Design Lecture: Distributed Systems & Caching Layers',
          videoUrl: 'https://www.youtube-nocookie.com/embed/bBTPZ946NnI',
          duration: '55 mins',
          description: 'Deep dive into Redis caching strategies, Write-through vs Write-back, and CAP theorem trade-offs.',
          uploadedAt: new Date(today11am),
        },
      ],
      documents: [
        {
          title: 'Distributed_Systems_Architecture_Blueprint_v2.pdf',
          fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          fileType: 'PDF',
          fileSize: '4.1 MB',
          uploadedAt: new Date(today11am),
        },
      ],
    },
    {
      teacherId: teachers[0]._id, // Abhishek Singh
      userId: null,
      startTime: today2pm,
      endTime: today3pm,
      status: SESSION_STATUS.AVAILABLE,
      completedAt: null,
      notes: [
        {
          title: 'Syllabus Prep Notes: Dynamic Programming & Memoization',
          content: '### Pre-Session Reading:\n- Optimal substructure and overlapping subproblems.\n- Top-down Memoization vs Bottom-up Tabulation.\n- Classic problems: 0/1 Knapsack, Longest Common Subsequence (LCS).',
          authorName: 'Abhishek Singh',
          createdAt: new Date(today2pm),
        },
      ],
      videoLectures: [
        {
          title: 'Introductory Video: Approaching Dynamic Programming Problems',
          videoUrl: 'https://www.youtube-nocookie.com/embed/oBt53YbR9Kk',
          duration: '42 mins',
          description: 'Step-by-step framework to identify state variables and recurrence relations.',
          uploadedAt: new Date(today2pm),
        },
      ],
      documents: [
        {
          title: 'Dynamic_Programming_Formula_Cheatsheet.pdf',
          fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          fileType: 'PDF',
          fileSize: '1.9 MB',
          uploadedAt: new Date(today2pm),
        },
      ],
    },
    {
      teacherId: teachers[1]._id, // Manas Tiwari
      userId: null,
      startTime: today4pm,
      endTime: today5pm,
      status: SESSION_STATUS.AVAILABLE,
      completedAt: null,
      notes: [
        {
          title: 'Database Architecture: MongoDB Indexing & Query Optimization',
          content: '### Key Concepts:\n- Single-field vs Compound Indexes with Equality-Sort-Range (ESR) rule.\n- Execution plans: IXSCAN vs COLLSCAN analysis using `explain("executionStats")`.\n- Aggregation Pipeline stages: `$match`, `$lookup`, `$project`, `$facet`.',
          authorName: 'Manas Tiwari',
          createdAt: new Date(today4pm),
        },
      ],
      videoLectures: [
        {
          title: 'Architecture Lab: Index Optimization & Profiling in MongoDB',
          videoUrl: 'https://www.youtube-nocookie.com/embed/ofme2o29ngU',
          duration: '60 mins',
          description: 'Hands-on terminal session demonstrating query plan debugging and compound index prefix rules.',
          uploadedAt: new Date(today4pm),
        },
      ],
      documents: [
        {
          title: 'MongoDB_Query_Optimization_Field_Guide.pdf',
          fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          fileType: 'PDF',
          fileSize: '3.6 MB',
          uploadedAt: new Date(today4pm),
        },
      ],
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
