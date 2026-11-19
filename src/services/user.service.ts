import { Types } from 'mongoose';
import { User, IUser } from '../models/user.model.js';
import { Session } from '../models/session.model.js';
import { AppError } from '../errors/app-error.js';
import { CreateUserInput } from '../schemas/user.schema.js';
import { SESSION_STATUS } from '../constants/index.js';

export class UserService {
  /**
   * API 1 - Create User
   * Creates a new user. Email must be unique.
   */
  static async createUser(data: CreateUserInput): Promise<IUser> {
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      throw AppError.conflict(`User with email '${data.email}' already exists`);
    }

    const newUser = await User.create({
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      phone: data.phone,
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
   * Get all users
   */
  static async getAllUsers(): Promise<IUser[]> {
    return await User.find().sort({ createdAt: -1 });
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
