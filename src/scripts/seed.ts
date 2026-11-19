import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import { User } from '../models/user.model.js';
import { Teacher } from '../models/teacher.model.js';
import { Session } from '../models/session.model.js';
import { SESSION_STATUS, ROLES } from '../constants/index.js';

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to database. Clearing existing data...');

    await Promise.all([
      User.deleteMany({}),
      Teacher.deleteMany({}),
      Session.deleteMany({}),
    ]);

    console.log('[Seed] Collections cleared.');

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
    console.log(`[Seed] Created ${teachers.length} teachers.`);

    // 2. Create Users with Passwords and Roles (RBAC)
    // Note: user.model pre('save') automatically hashes plain text password
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
    console.log(`[Seed] Created ${users.length} users with RBAC roles.`);

    // 3. Create Sessions for Today & Tomorrow
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Today session 1: 09:00 - 10:00 (Completed for Saurabh Agnihotri with Abhishek Singh)
    const today9am = new Date(today);
    today9am.setUTCHours(9, 0, 0, 0);
    const today10am = new Date(today);
    today10am.setUTCHours(10, 0, 0, 0);

    // Today session 2: 11:00 - 12:00 (Booked by Saurabh Agnihotri with Manas Tiwari)
    const today11am = new Date(today);
    today11am.setUTCHours(11, 0, 0, 0);
    const today12pm = new Date(today);
    today12pm.setUTCHours(12, 0, 0, 0);

    // Today session 3: 14:00 - 15:00 (Available with Abhishek Singh)
    const today2pm = new Date(today);
    today2pm.setUTCHours(14, 0, 0, 0);
    const today3pm = new Date(today);
    today3pm.setUTCHours(15, 0, 0, 0);

    // Today session 4: 16:00 - 17:00 (Available with Manas Tiwari)
    const today4pm = new Date(today);
    today4pm.setUTCHours(16, 0, 0, 0);
    const today5pm = new Date(today);
    today5pm.setUTCHours(17, 0, 0, 0);

    // Tomorrow session 1: 10:00 - 11:00 (Available with Abhishek Singh)
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const tomorrow10am = new Date(tomorrow);
    tomorrow10am.setUTCHours(10, 0, 0, 0);
    const tomorrow11am = new Date(tomorrow);
    tomorrow11am.setUTCHours(11, 0, 0, 0);

    const sessions = await Session.create([
      {
        teacherId: teachers[0]._id, // Abhishek Singh
        userId: users[0]._id, // Saurabh Agnihotri
        startTime: today9am,
        endTime: today10am,
        status: SESSION_STATUS.COMPLETED,
        completedAt: new Date(today10am),
      },
      {
        teacherId: teachers[1]._id, // Manas Tiwari
        userId: users[0]._id, // Saurabh Agnihotri
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

    console.log(`[Seed] Created ${sessions.length} sessions.`);
    console.log('\n--- SEED RBAC USERS & PASSWORDS ---');
    console.log(`All accounts have default password: 'Password@123'`);
    console.log(`1. Student 1: ${users[0].fullName} (${users[0].email}) - Role: ${users[0].role}`);
    console.log(`2. Student 2: ${users[1].fullName} (${users[1].email}) - Role: ${users[1].role}`);
    console.log(`3. Teacher 1: ${users[2].fullName} (${users[2].email}) - Role: ${users[2].role}`);
    console.log(`4. Teacher 2: ${users[3].fullName} (${users[3].email}) - Role: ${users[3].role}`);
    console.log(`5. Admin:     ${users[4].fullName} (${users[4].email}) - Role: ${users[4].role}`);
    console.log('-----------------------------------\n');

    await mongoose.connection.close();
    console.log('[Seed] Seeding completed successfully. Disconnected from database.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Database seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
