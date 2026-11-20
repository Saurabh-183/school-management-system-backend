import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { User } from '../models/user.model.js';
import { Teacher } from '../models/teacher.model.js';
import { Session } from '../models/session.model.js';
import { ApiResponse } from '../utils/api-response.js';
import { HTTP_STATUS, SESSION_STATUS, ROLES } from '../constants/index.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../errors/app-error.js';
import { EmailService } from '../services/email.service.js';

export class AdminController {
  /**
   * General platform overview for Admin and Super Admin
   */
  static getOverview = asyncHandler(async (_req: Request, res: Response) => {
    const [
      totalUsers,
      totalStudents,
      totalTeachersInUsers,
      totalTeachers,
      totalSessions,
      availableSessions,
      bookedSessions,
      completedSessions,
      recentSessions,
      allUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: ROLES.STUDENT }),
      User.countDocuments({ role: ROLES.TEACHER }),
      Teacher.countDocuments(),
      Session.countDocuments(),
      Session.countDocuments({ status: SESSION_STATUS.AVAILABLE }),
      Session.countDocuments({ status: SESSION_STATUS.BOOKED }),
      Session.countDocuments({ status: SESSION_STATUS.COMPLETED }),
      Session.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('teacherId')
        .populate('userId'),
      User.find().sort({ createdAt: -1 }).select('-password'),
    ]);

    const overview = {
      metrics: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalSessions,
        availableSessions,
        bookedSessions,
        completedSessions,
      },
      recentSessions,
      users: allUsers,
    };

    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('Admin platform overview retrieved', overview)
    );
  });

  /**
   * Super Admin only: Provision a new Organization / School Admin
   */
  static createAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { fullName, email, phone, password, organization } = req.body;

    if (!fullName || !email || !password || !organization) {
      throw AppError.badRequest('Full name, email, password, and organization name are required');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw AppError.conflict(`User with email '${email}' already exists`);
    }

    const creatorUser = req.user?.userId ? await User.findById(req.user.userId) : null;

    const newAdmin = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || '+919876543200',
      password: password,
      plainPassword: password,
      role: ROLES.ADMIN,
      organization: organization.trim(),
      classGrade: 'School Administrator',
      createdBy: req.user?.userId ? new Types.ObjectId(req.user.userId) : null,
      createdByName: creatorUser?.fullName || 'Super Admin Platform Owner',
      createdByRole: ROLES.SUPER_ADMIN,
      accountStatus: 'ACTIVE',
      isTrial: false,
    });

    // Send professional onboarding welcome email
    await EmailService.sendWelcomeEmail({
      fullName: newAdmin.fullName,
      email: newAdmin.email,
      phone: newAdmin.phone,
      role: ROLES.ADMIN,
      organization: newAdmin.organization || organization || 'General Organization',
      temporaryPassword: password,
      isTrial: false,
    }).catch((err) => console.error('Failed to send admin welcome email:', err));

    res.status(HTTP_STATUS.CREATED).json(
      ApiResponse.success(`Admin '${newAdmin.fullName}' provisioned for organization '${organization}'`, {
        _id: newAdmin._id,
        fullName: newAdmin.fullName,
        email: newAdmin.email,
        phone: newAdmin.phone,
        role: newAdmin.role,
        organization: newAdmin.organization,
        plainPassword: newAdmin.plainPassword,
        createdAt: newAdmin.createdAt,
      })
    );
  });

  /**
   * Admin / Super Admin: Create a Teacher under their facility
   */
  static createTeacher = asyncHandler(async (req: Request, res: Response) => {
    const { fullName, email, phone, password, specialization, experienceYears, assignedClasses, organization } = req.body;

    if (!fullName || !email || !password) {
      throw AppError.badRequest('Full name, email, and password are required');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw AppError.conflict(`User with email '${email}' already exists`);
    }

    const creatorUser = req.user?.userId ? await User.findById(req.user.userId) : null;
    const org = organization?.trim() || creatorUser?.organization || 'Delhi Public School (DPS Campus)';

    // 1. Create Teacher profile
    const teacherProfile = await Teacher.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || '+919876543210',
      specialization: specialization?.trim() || 'General Studies & Science',
      experience: Number(experienceYears) || 5,
      organization: org,
      assignedClasses: Array.isArray(assignedClasses) && assignedClasses.length > 0 ? assignedClasses : ['Class 10-A', 'Class 12-A'],
      createdBy: req.user?.userId ? new Types.ObjectId(req.user.userId) : null,
      createdByName: creatorUser?.fullName || 'School Administration',
    });

    // 2. Create User account for authentication
    const newUser = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || '+919876543210',
      password: password,
      plainPassword: password,
      role: ROLES.TEACHER,
      teacherId: teacherProfile._id,
      organization: org,
      classGrade: 'Faculty Instructor',
      createdBy: req.user?.userId ? new Types.ObjectId(req.user.userId) : null,
      createdByName: creatorUser?.fullName || 'School Administration',
      createdByRole: creatorUser?.role || ROLES.ADMIN,
      accountStatus: 'ACTIVE',
      isTrial: false,
    });

    // Send professional onboarding welcome email
    await EmailService.sendWelcomeEmail({
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      role: ROLES.TEACHER,
      organization: newUser.organization || org || 'General Organization',
      temporaryPassword: password,
      isTrial: false,
    }).catch((err) => console.error('Failed to send teacher welcome email:', err));

    res.status(HTTP_STATUS.CREATED).json(
      ApiResponse.success(`Teacher '${newUser.fullName}' created successfully under facility '${org}'`, {
        _id: newUser._id,
        teacherId: teacherProfile._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        organization: newUser.organization,
        plainPassword: newUser.plainPassword,
        createdBy: newUser.createdBy,
        createdByName: newUser.createdByName,
        createdAt: newUser.createdAt,
      })
    );
  });

  /**
   * Teacher / Admin / Super Admin: Create an enrolled Student under their facility/class
   */
  static createStudent = asyncHandler(async (req: Request, res: Response) => {
    const { fullName, email, phone, password, classGrade, organization } = req.body;

    if (!fullName || !email || !password) {
      throw AppError.badRequest('Full name, email, and password are required');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw AppError.conflict(`User with email '${email}' already exists`);
    }

    const creatorUser = req.user?.userId ? await User.findById(req.user.userId) : null;
    const org = organization?.trim() || creatorUser?.organization || 'Delhi Public School (DPS Campus)';
    const grade = classGrade?.trim() || 'Class 12-A';

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || '+919876543210',
      password: password,
      plainPassword: password,
      role: ROLES.STUDENT,
      organization: org,
      classGrade: grade,
      createdBy: req.user?.userId ? new Types.ObjectId(req.user.userId) : null,
      createdByName: creatorUser?.fullName || 'Faculty Mentor',
      createdByRole: creatorUser?.role || ROLES.TEACHER,
      accountStatus: 'ACTIVE',
      isTrial: false,
    });

    // Send professional onboarding welcome email
    await EmailService.sendWelcomeEmail({
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      role: ROLES.STUDENT,
      organization: newUser.organization || org || 'General Organization',
      classGrade: grade,
      temporaryPassword: password,
      isTrial: false,
    }).catch((err) => console.error('Failed to send student welcome email:', err));

    res.status(HTTP_STATUS.CREATED).json(
      ApiResponse.success(`Enrolled student '${newUser.fullName}' created under ${creatorUser?.fullName || 'Faculty'}`, {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        organization: newUser.organization,
        classGrade: newUser.classGrade,
        plainPassword: newUser.plainPassword,
        createdBy: newUser.createdBy,
        createdByName: newUser.createdByName,
        createdAt: newUser.createdAt,
      })
    );
  });

  /**
   * Super Admin Activity Logs Module:
   * View all accounts with passwords (for direct verification/support), online/offline status,
   * login/logout/active timestamps, trial status (including remaining time or expired/deleted),
   * and allow one-click direct login without logging activity.
   */
  static getActivityLogs = asyncHandler(async (req: Request, res: Response) => {
    const { status, search } = req.query;

    const query: Record<string, any> = {};

    if (status === 'online') {
      query.isOnline = true;
    } else if (status === 'trial') {
      query.isTrial = true;
    } else if (status === 'deleted' || status === 'expired') {
      query.accountStatus = { $in: ['DELETED', 'EXPIRED'] };
    } else if (status === 'active') {
      query.accountStatus = 'ACTIVE';
    }

    if (search && typeof search === 'string') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { fullName: regex },
        { email: regex },
        { phone: regex },
        { organization: regex },
        { classGrade: regex },
      ];
    }

    const allUsers = await User.find(query).sort({ createdAt: -1 });

    const totalAccounts = await User.countDocuments();
    const onlineAccounts = await User.countDocuments({ isOnline: true });
    const trialAccounts = await User.countDocuments({ isTrial: true });
    const deletedOrExpiredAccounts = await User.countDocuments({ accountStatus: { $in: ['DELETED', 'EXPIRED'] } });
    const activeAccounts = await User.countDocuments({ accountStatus: 'ACTIVE' });

    const logs = allUsers.map((u) => {
      // Calculate remaining trial time if trial user
      let trialRemainingHours: number | null = null;
      if (u.isTrial && u.trialExpiresAt) {
        const diff = new Date(u.trialExpiresAt).getTime() - Date.now();
        trialRemainingHours = diff > 0 ? Math.round((diff / (1000 * 3600)) * 10) / 10 : 0;
      }

      return {
        _id: u._id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        role: u.role,
        organization: u.organization || 'General Organization',
        classGrade: u.classGrade || 'N/A',
        plainPassword: u.plainPassword || 'Password@123',
        isTrial: Boolean(u.isTrial),
        trialExpiresAt: u.trialExpiresAt,
        trialRemainingHours,
        accountStatus: u.accountStatus || 'ACTIVE',
        isOnline: Boolean(u.isOnline),
        lastLoginAt: u.lastLoginAt,
        lastLogoutAt: u.lastLogoutAt,
        lastActiveAt: u.lastActiveAt,
        createdBy: u.createdBy,
        createdByName: u.createdByName || 'Direct / System',
        createdByRole: u.createdByRole || 'SYSTEM',
        createdAt: u.createdAt,
      };
    });

    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('Super Admin platform activity logs retrieved', {
        metrics: {
          totalAccounts,
          onlineAccounts,
          trialAccounts,
          deletedOrExpiredAccounts,
          activeAccounts,
        },
        logs,
      })
    );
  });

  /**
   * Super Admin Overview: Full hierarchy of Admins, Organizations, Teachers & Students
   */
  static getSuperOverview = asyncHandler(async (_req: Request, res: Response) => {
    const [
      admins,
      teachers,
      students,
      sessions,
    ] = await Promise.all([
      User.find({ role: ROLES.ADMIN }).select('-password').sort({ createdAt: -1 }),
      Teacher.find().sort({ createdAt: -1 }),
      User.find({ role: ROLES.STUDENT }).select('-password').sort({ createdAt: -1 }),
      Session.find().populate('teacherId').populate('userId').sort({ createdAt: -1 }).limit(15),
    ]);

    // Aggregate unique organizations
    const orgMap: Record<string, { name: string; adminsCount: number; teachersCount: number; studentsCount: number }> = {};

    admins.forEach((a) => {
      const org = a.organization || 'General';
      if (!orgMap[org]) orgMap[org] = { name: org, adminsCount: 0, teachersCount: 0, studentsCount: 0 };
      orgMap[org].adminsCount += 1;
    });

    teachers.forEach((t) => {
      const org = t.organization || 'General';
      if (!orgMap[org]) orgMap[org] = { name: org, adminsCount: 0, teachersCount: 0, studentsCount: 0 };
      orgMap[org].teachersCount += 1;
    });

    students.forEach((s) => {
      const org = s.organization || 'General';
      if (!orgMap[org]) orgMap[org] = { name: org, adminsCount: 0, teachersCount: 0, studentsCount: 0 };
      orgMap[org].studentsCount += 1;
    });

    const data = {
      metrics: {
        totalAdmins: admins.length,
        totalOrganizations: Object.keys(orgMap).length,
        totalTeachers: teachers.length,
        totalStudents: students.length,
        totalSessions: sessions.length,
      },
      admins,
      organizations: Object.values(orgMap),
      teachers,
      students,
      recentSessions: sessions,
    };

    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('Super Admin hierarchy overview retrieved', data)
    );
  });

  /**
   * Organization / School Admin Overview: Filtered by the Admin's organization
   */
  static getSchoolOverview = asyncHandler(async (req: Request, res: Response) => {
    // If Admin, get their organization, or default
    const adminOrg = req.user ? (await User.findById(req.user.userId))?.organization : null;
    const orgFilter = adminOrg || 'Delhi Public School (DPS Campus)';

    const [
      teachers,
      students,
      allSessions,
    ] = await Promise.all([
      Teacher.find({ organization: orgFilter }).sort({ createdAt: -1 }),
      User.find({ role: ROLES.STUDENT, organization: orgFilter }).select('-password').sort({ createdAt: -1 }),
      Session.find().populate('teacherId').populate('userId').sort({ createdAt: -1 }),
    ]);

    // Filter sessions belonging to teachers in this school
    const teacherIds = new Set(teachers.map((t) => t._id.toString()));
    const schoolSessions = allSessions.filter((s) => s.teacherId && teacherIds.has((s.teacherId as any)._id?.toString() || s.teacherId.toString()));

    // Distinct classes
    const classSet = new Set<string>();
    students.forEach((s) => {
      if (s.classGrade) classSet.add(s.classGrade);
    });
    teachers.forEach((t) => {
      t.assignedClasses?.forEach((c) => classSet.add(c));
    });

    const data = {
      organizationName: orgFilter,
      metrics: {
        totalTeachers: teachers.length,
        totalStudents: students.length,
        totalClasses: classSet.size || 2,
        totalSessions: schoolSessions.length,
      },
      classes: Array.from(classSet),
      teachers,
      students,
      sessions: schoolSessions.slice(0, 15),
    };

    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('School / Organization overview retrieved', data)
    );
  });
}
