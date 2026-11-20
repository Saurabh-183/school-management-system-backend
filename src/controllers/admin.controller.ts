import { Request, Response } from 'express';
import { User } from '../models/user.model.js';
import { Teacher } from '../models/teacher.model.js';
import { Session } from '../models/session.model.js';
import { ApiResponse } from '../utils/api-response.js';
import { HTTP_STATUS, SESSION_STATUS, ROLES } from '../constants/index.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../errors/app-error.js';

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

    const newAdmin = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || '+919876543200',
      password: password,
      role: ROLES.ADMIN,
      organization: organization.trim(),
      classGrade: 'School Administrator',
    });

    res.status(HTTP_STATUS.CREATED).json(
      ApiResponse.success(`Admin '${newAdmin.fullName}' provisioned for organization '${organization}'`, {
        _id: newAdmin._id,
        fullName: newAdmin.fullName,
        email: newAdmin.email,
        phone: newAdmin.phone,
        role: newAdmin.role,
        organization: newAdmin.organization,
        createdAt: newAdmin.createdAt,
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
