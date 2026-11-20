import { Types } from 'mongoose';
import { Teacher, ITeacher } from '../models/teacher.model.js';
import { Session } from '../models/session.model.js';
import { CreateTeacherInput } from '../schemas/teacher.schema.js';
import { AppError } from '../errors/app-error.js';
import { SESSION_STATUS, ROLES } from '../constants/index.js';

export class TeacherService {
  static async createTeacher(data: CreateTeacherInput): Promise<ITeacher> {
    const existingTeacher = await Teacher.findOne({ email: data.email.toLowerCase() });
    if (existingTeacher) {
      throw AppError.conflict(`Teacher with email '${data.email}' already exists`);
    }

    const teacher = await Teacher.create({
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      specialization: data.specialization,
      experience: data.experience,
    });

    return teacher;
  }

  static async getAllTeachers(filter?: { organization?: string; createdBy?: string; role?: string }): Promise<ITeacher[]> {
    if (filter && filter.role === ROLES.ADMIN && filter.organization) {
      return await Teacher.find({
        $or: [
          { organization: filter.organization },
          ...(filter.createdBy ? [{ createdBy: new Types.ObjectId(filter.createdBy) }] : []),
        ],
      }).sort({ createdAt: -1 });
    }
    return await Teacher.find().sort({ createdAt: -1 });
  }

  static async getTeacherById(id: string): Promise<ITeacher | null> {
    return await Teacher.findById(id);
  }

  /**
   * Get all sessions for a teacher separated into Available, Booked, and Completed
   * Implemented using MongoDB Aggregation Pipeline ($facet)
   */
  static async getTeacherSessions(teacherId: string) {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw AppError.notFound(`Teacher not found with ID: ${teacherId}`);
    }

    const teacherObjectId = new Types.ObjectId(teacherId);

    const pipeline: any[] = [
      {
        $match: {
          teacherId: teacherObjectId,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          startTime: 1,
          endTime: 1,
          status: 1,
          completedAt: 1,
          createdAt: 1,
          updatedAt: 1,
          user: {
            _id: '$user._id',
            fullName: '$user.fullName',
            email: '$user.email',
            phone: '$user.phone',
          },
        },
      },
      {
        $facet: {
          availableSessions: [
            { $match: { status: SESSION_STATUS.AVAILABLE } },
            { $sort: { startTime: 1 } },
          ],
          bookedSessions: [
            { $match: { status: SESSION_STATUS.BOOKED } },
            { $sort: { startTime: 1 } },
          ],
          completedSessions: [
            { $match: { status: SESSION_STATUS.COMPLETED } },
            { $sort: { completedAt: -1, startTime: -1 } },
          ],
        },
      },
    ];

    const [result] = await Session.aggregate(pipeline);

    const availableSessions = result?.availableSessions || [];
    const bookedSessions = result?.bookedSessions || [];
    const completedSessions = result?.completedSessions || [];

    return {
      teacher,
      availableSessions,
      bookedSessions,
      completedSessions,
      metrics: {
        totalAvailable: availableSessions.length,
        totalBooked: bookedSessions.length,
        totalCompleted: completedSessions.length,
        totalSessions: availableSessions.length + bookedSessions.length + completedSessions.length,
      },
    };
  }
}
