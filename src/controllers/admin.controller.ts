import { Request, Response } from 'express';
import { User } from '../models/user.model.js';
import { Teacher } from '../models/teacher.model.js';
import { Session } from '../models/session.model.js';
import { ApiResponse } from '../utils/api-response.js';
import { HTTP_STATUS, SESSION_STATUS, ROLES } from '../constants/index.js';
import { asyncHandler } from '../utils/async-handler.js';

export class AdminController {
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
}
