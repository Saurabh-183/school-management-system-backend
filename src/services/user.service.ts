import { Types } from 'mongoose';
import { User, IUser } from '../models/user.model.js';
import { Session } from '../models/session.model.js';
import { AppError } from '../errors/app-error.js';
import { CreateUserInput } from '../schemas/user.schema.js';
import { SESSION_STATUS, ROLES } from '../constants/index.js';
import { EmailService } from './email.service.js';

export class UserService {
  /**
   * API 1 - Create User
   * Creates a new student / user under the creator's facility or classroom.
   */
  static async createUser(
    data: CreateUserInput & {
      organization?: string;
      classGrade?: string;
      password?: string;
    },
    creator?: { userId: string; fullName: string; role: string; organization?: string }
  ): Promise<IUser> {
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      throw AppError.conflict(`User with email '${data.email}' already exists`);
    }

    const org = data.organization || creator?.organization || 'Delhi Public School (DPS Campus)';
    const assignedClass = data.classGrade || 'Class 12-A';
    const pwd = data.password || 'Password@123';

    const newUser = await User.create({
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      password: pwd,
      plainPassword: pwd,
      role: ROLES.STUDENT,
      organization: org,
      classGrade: assignedClass,
      createdBy: creator?.userId ? new Types.ObjectId(creator.userId) : null,
      createdByName: creator?.fullName || 'Institutional Administration',
      createdByRole: creator?.role || 'TEACHER',
      isTrial: false,
      accountStatus: 'ACTIVE',
    });

    // Send professional onboarding welcome email
    await EmailService.sendWelcomeEmail({
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      role: 'STUDENT',
      organization: org,
      classGrade: assignedClass,
      temporaryPassword: pwd,
      isTrial: false,
    });

    return newUser;
  }

  /**
   * Find user by ID
   */
  static async getUserById(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }

  /**
   * Get all users with hierarchical role isolation:
   * - Super Admin: views all users
   * - School Admin: views users under their organization / facility
   * - Teacher: views strictly students created by them under their facility
   */
  static async getAllUsers(filterUser?: { userId: string; role: string; organization?: string }): Promise<IUser[]> {
    if (!filterUser || filterUser.role === ROLES.SUPER_ADMIN) {
      return await User.find().sort({ createdAt: -1 });
    }

    if (filterUser.role === ROLES.ADMIN) {
      return await User.find({
        $or: [
          { organization: filterUser.organization },
          { createdBy: new Types.ObjectId(filterUser.userId) },
        ],
      }).sort({ createdAt: -1 });
    }

    if (filterUser.role === ROLES.TEACHER) {
      const orConditions: any[] = [
        { createdBy: new Types.ObjectId(filterUser.userId) },
      ];
      if (filterUser.organization) {
        orConditions.push({ organization: filterUser.organization, role: ROLES.STUDENT });
      }
      return await User.find({ $or: orConditions }).sort({ createdAt: -1 });
    }

    return await User.find({ _id: new Types.ObjectId(filterUser.userId) });
  }

  /**
   * API 6 - User Session List
   * Return all sessions for the user separated into:
   * - Upcoming Sessions
   * - Completed Sessions
   * Mandatory: Implemented using MongoDB Aggregation Pipeline ($facet).
   */
  static async getUserSessions(userId: string) {
    // Validate user existence
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound(`User not found with ID: ${userId}`);
    }

    const userObjectId = new Types.ObjectId(userId);

    const pipeline: any[] = [
      // Stage 1: Match sessions associated with the user
      {
        $match: {
          userId: userObjectId,
        },
      },
      // Stage 2: Join teacher details
      {
        $lookup: {
          from: 'teachers',
          localField: 'teacherId',
          foreignField: '_id',
          as: 'teacher',
        },
      },
      // Stage 3: Unwind teacher object
      {
        $unwind: {
          path: '$teacher',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Stage 4: Project clean fields
      {
        $project: {
          _id: 1,
          startTime: 1,
          endTime: 1,
          status: 1,
          completedAt: 1,
          createdAt: 1,
          updatedAt: 1,
          teacher: {
            _id: '$teacher._id',
            fullName: '$teacher.fullName',
            email: '$teacher.email',
            specialization: '$teacher.specialization',
            experience: '$teacher.experience',
          },
        },
      },
      // Stage 5: Facet into Upcoming and Completed sessions
      {
        $facet: {
          upcomingSessions: [
            {
              $match: {
                status: SESSION_STATUS.BOOKED,
              },
            },
            {
              $sort: { startTime: 1 },
            },
          ],
          completedSessions: [
            {
              $match: {
                status: SESSION_STATUS.COMPLETED,
              },
            },
            {
              $sort: { completedAt: -1, startTime: -1 },
            },
          ],
        },
      },
    ];

    const [result] = await Session.aggregate(pipeline);

    return {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      upcomingSessions: result?.upcomingSessions || [],
      completedSessions: result?.completedSessions || [],
    };
  }
}
