import { Types } from 'mongoose';
import { Session, ISession } from '../models/session.model.js';
import { Teacher } from '../models/teacher.model.js';
import { User } from '../models/user.model.js';
import { AppError } from '../errors/app-error.js';
import { SESSION_STATUS } from '../constants/index.js';
import { CreateSessionInput } from '../schemas/session.schema.js';

export class SessionService {
  /**
   * API 2 - Create Session
   * Create a new session for a teacher. Default status should be AVAILABLE.
   * Validate teacher exists and endTime is greater than startTime.
   */
  static async createSession(data: CreateSessionInput): Promise<ISession> {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (end.getTime() <= start.getTime()) {
      throw AppError.badRequest('endTime must be greater than startTime');
    }

    // Validate teacher exists
    const teacher = await Teacher.findById(data.teacherId);
    if (!teacher) {
      throw AppError.notFound(`Teacher not found with ID: ${data.teacherId}`);
    }

    // Check for overlapping sessions for this teacher
    const overlappingSession = await Session.findOne({
      teacherId: new Types.ObjectId(data.teacherId),
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } },
      ],
    });

    if (overlappingSession) {
      throw AppError.conflict(
        `Teacher already has an overlapping session scheduled between ${start.toISOString()} and ${end.toISOString()}`
      );
    }

    const session = await Session.create({
      teacherId: new Types.ObjectId(data.teacherId),
      startTime: start,
      endTime: end,
      status: SESSION_STATUS.AVAILABLE,
      userId: null,
      completedAt: null,
    });

    return session;
  }

  /**
   * API 3 - Available Sessions for Booking
   * Return all AVAILABLE sessions for the supplied date with pagination and debounced search support.
   * Mandatory: Implemented using MongoDB Aggregation Pipeline.
   */
  static async getAvailableSessions(
    dateTimestamp: string,
    options?: { page?: number; limit?: number; search?: string }
  ) {
    let parsedDate: Date;
    if (/^\d+$/.test(dateTimestamp)) {
      const num = Number(dateTimestamp);
      parsedDate = new Date(num > 1e11 ? num : num * 1000);
    } else {
      parsedDate = new Date(dateTimestamp);
    }

    if (isNaN(parsedDate.getTime())) {
      throw AppError.badRequest('Invalid date timestamp provided');
    }

    // Calculate start and end of day in UTC
    const startOfDayUTC = new Date(Date.UTC(
      parsedDate.getUTCFullYear(),
      parsedDate.getUTCMonth(),
      parsedDate.getUTCDate(),
      0, 0, 0, 0
    ));
    const endOfDayUTC = new Date(Date.UTC(
      parsedDate.getUTCFullYear(),
      parsedDate.getUTCMonth(),
      parsedDate.getUTCDate(),
      23, 59, 59, 999
    ));

    const page = options?.page ? Math.max(1, Number(options.page)) : 1;
    const limit = options?.limit ? Math.max(1, Number(options.limit)) : 10;
    const skip = (page - 1) * limit;
    const search = options?.search?.trim();

    // MongoDB Aggregation Pipeline Stages
    const pipeline: any[] = [
      // Stage 1: Match sessions with status AVAILABLE within the given day
      {
        $match: {
          status: SESSION_STATUS.AVAILABLE,
          startTime: {
            $gte: startOfDayUTC,
            $lte: endOfDayUTC,
          },
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
          preserveNullAndEmptyArrays: false,
        },
      },
    ];

    // Stage 4 (Optional): Debounced search on teacher name or specialization
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'teacher.fullName': searchRegex },
            { 'teacher.specialization': searchRegex },
            { 'teacher.email': searchRegex },
          ],
        },
      });
    }

    // Stage 5: Project clean format
    pipeline.push({
      $project: {
        _id: 1,
        startTime: 1,
        endTime: 1,
        status: 1,
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
    });

    // Stage 6: Facet for server-side pagination & metadata
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        sessions: [
          { $sort: { startTime: 1 } },
          { $skip: skip },
          { $limit: limit },
        ],
      },
    });

    const [result] = await Session.aggregate(pipeline);
    const total = result?.metadata[0]?.total || 0;
    const sessions = result?.sessions || [];
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      date: startOfDayUTC.toISOString().split('T')[0],
      totalAvailable: total,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      sessions,
    };
  }

  /**
   * API 4 - Book Session
   * Rules:
   * - User must exist.
   * - Session must exist.
   * - Only AVAILABLE sessions can be booked.
   * - A booked session cannot be booked again.
   * - Update session status to BOOKED and associate it with the user.
   */
  static async bookSession(sessionId: string, userId: string) {
    // Rule 1: User must exist
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound(`User not found with ID: ${userId}`);
    }

    // Rule 2: Session must exist
    const existingSession = await Session.findById(sessionId);
    if (!existingSession) {
      throw AppError.notFound(`Session not found with ID: ${sessionId}`);
    }

    // Rule 3 & 4: Only AVAILABLE sessions can be booked
    if (existingSession.status === SESSION_STATUS.BOOKED) {
      throw AppError.badRequest('Session is already booked and cannot be booked again');
    }
    if (existingSession.status === SESSION_STATUS.COMPLETED) {
      throw AppError.badRequest('Session has already been completed');
    }

    // Rule 5: Atomic update to prevent race conditions
    const updatedSession = await Session.findOneAndUpdate(
      { _id: new Types.ObjectId(sessionId), status: SESSION_STATUS.AVAILABLE },
      {
        $set: {
          status: SESSION_STATUS.BOOKED,
          userId: new Types.ObjectId(userId),
        },
      },
      { new: true }
    )
      .populate('teacherId', 'fullName email specialization experience')
      .populate('userId', 'fullName email phone');

    if (!updatedSession) {
      throw AppError.conflict('Session was just booked by another user. Please choose another session.');
    }

    return updatedSession;
  }

  /**
   * API 5 - Mark Session Complete
   * Rules:
   * - Session must exist.
   * - Only BOOKED sessions can be marked as completed.
   * - Update status to COMPLETED and set completedAt.
   */
  static async completeSession(sessionId: string) {
    // Rule 1: Session must exist
    const existingSession = await Session.findById(sessionId);
    if (!existingSession) {
      throw AppError.notFound(`Session not found with ID: ${sessionId}`);
    }

    // Rule 2: Only BOOKED sessions can be marked as completed
    if (existingSession.status === SESSION_STATUS.AVAILABLE) {
      throw AppError.badRequest('Cannot complete an AVAILABLE session. Session must be booked first.');
    }
    if (existingSession.status === SESSION_STATUS.COMPLETED) {
      throw AppError.badRequest('Session is already completed.');
    }

    // Rule 3: Update status to COMPLETED and set completedAt
    const updatedSession = await Session.findOneAndUpdate(
      { _id: new Types.ObjectId(sessionId), status: SESSION_STATUS.BOOKED },
      {
        $set: {
          status: SESSION_STATUS.COMPLETED,
          completedAt: new Date(),
        },
      },
      { new: true }
    )
      .populate('teacherId', 'fullName email specialization experience')
      .populate('userId', 'fullName email phone');

    return updatedSession;
  }
}
