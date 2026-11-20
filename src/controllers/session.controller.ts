import { Request, Response } from 'express';
import { SessionService } from '../services/session.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { HTTP_STATUS } from '../constants/index.js';
import { asyncHandler } from '../utils/async-handler.js';

export class SessionController {
  /**
   * API 2 - Create Session
   * POST /sessions
   */
  static createSession = asyncHandler(async (req: Request, res: Response) => {
    const session = await SessionService.createSession(req.body);
    res.status(HTTP_STATUS.CREATED).json(
      ApiResponse.success('Session created successfully', session)
    );
  });

  /**
   * API 3 - Available Sessions for Booking
   * GET /sessions/available?dateTimestamp={timestamp}&page=1&limit=10&search=...
   */
  static getAvailableSessions = asyncHandler(async (req: Request, res: Response) => {
    const { dateTimestamp, page, limit, search } = req.query;
    const result = await SessionService.getAvailableSessions(dateTimestamp as string, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search as string | undefined,
    });
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('Available sessions retrieved successfully', result)
    );
  });

  /**
   * API 4 - Book Session
   * POST /sessions/:id/book
   */
  static bookSession = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { userId } = req.body;
    const session = await SessionService.bookSession(id, userId);
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('Session booked successfully', session)
    );
  });

  /**
   * API 5 - Mark Session Complete
   * PATCH /sessions/:id/complete
   */
  static completeSession = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const session = await SessionService.completeSession(id);
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('Session marked as completed successfully', session)
    );
  });

  /**
   * Learning Resources: Add Lecture Note
   * POST /sessions/:id/notes
   */
  static addLectureNote = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const session = await SessionService.addLectureNote(id, {
      ...req.body,
      authorName: req.user?.fullName || req.body.authorName,
      authorUserId: req.user?.userId,
    });
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('Lecture note added successfully', session)
    );
  });

  /**
   * Learning Resources: Add Video Lecture
   * POST /sessions/:id/videos
   */
  static addVideoLecture = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const session = await SessionService.addVideoLecture(id, {
      ...req.body,
      authorUserId: req.user?.userId,
    });
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('Video lecture attached successfully', session)
    );
  });

  /**
   * Learning Resources: Add Subject Document
   * POST /sessions/:id/documents
   */
  static addSubjectDocument = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const session = await SessionService.addSubjectDocument(id, {
      ...req.body,
      authorUserId: req.user?.userId,
    });
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('Subject document uploaded successfully', session)
    );
  });

  /**
   * Learning Resources: Get All Resources for a Session
   * GET /sessions/:id/resources
   */
  static getSessionResources = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const resources = await SessionService.getSessionResources(id);
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('Learning resources retrieved successfully', resources)
    );
  });
}
