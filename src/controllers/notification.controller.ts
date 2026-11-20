import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { HTTP_STATUS } from '../constants/index.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../errors/app-error.js';

export class NotificationController {
  /**
   * GET /notifications
   * Returns recent notifications and unread count for authenticated user
   */
  static getNotifications = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw AppError.unauthorized('Authentication required to retrieve notifications');
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
    const data = await NotificationService.getUserNotifications(userId, limit);

    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('User notifications retrieved successfully', data)
    );
  });

  /**
   * PATCH /notifications/:id/read
   * Mark a single notification as read
   */
  static markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const notificationId = req.params.id as string;

    if (!userId) {
      throw AppError.unauthorized('Authentication required');
    }

    const notification = await NotificationService.markAsRead(notificationId, userId);
    if (!notification) {
      throw AppError.notFound('Notification not found or access denied');
    }

    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('Notification marked as read', notification)
    );
  });

  /**
   * PATCH /notifications/read-all
   * Mark all unread notifications as read
   */
  static markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw AppError.unauthorized('Authentication required');
    }

    const result = await NotificationService.markAllAsRead(userId);

    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('All notifications marked as read', result)
    );
  });
}
