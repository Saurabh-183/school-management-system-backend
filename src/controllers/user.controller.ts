import { Request, Response } from 'express';
import { UserService } from '../services/user.service.js';
import { User } from '../models/user.model.js';
import { ApiResponse } from '../utils/api-response.js';
import { HTTP_STATUS } from '../constants/index.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../errors/app-error.js';

export class UserController {
  /**
   * API 1 - Create User
   * POST /users
   */
  static createUser = asyncHandler(async (req: Request, res: Response) => {
    let creatorInfo;
    if (req.user) {
      const creatorDoc = await User.findById(req.user.userId);
      creatorInfo = {
        userId: req.user.userId,
        fullName: req.user.fullName,
        role: req.user.role,
        organization: creatorDoc?.organization,
      };
    }

    const user = await UserService.createUser(req.body, creatorInfo);
    res.status(HTTP_STATUS.CREATED).json(
      ApiResponse.success('User created successfully', user)
    );
  });

  /**
   * API 6 - User Session List
   * GET /users/:id/sessions
   */
  static getUserSessions = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const sessionData = await UserService.getUserSessions(id);
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('User sessions retrieved successfully', sessionData)
    );
  });

  /**
   * Helper: Get All Users with hierarchical RBAC creator isolation
   * GET /users
   */
  static getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    let filterUser;
    if (req.user) {
      const uDoc = await User.findById(req.user.userId);
      filterUser = {
        userId: req.user.userId,
        role: req.user.role,
        organization: uDoc?.organization,
      };
    }
    const users = await UserService.getAllUsers(filterUser);
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('Users retrieved successfully', users)
    );
  });

  /**
   * Helper: Get User By ID
   * GET /users/:id
   */
  static getUserById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const user = await UserService.getUserById(id);
    if (!user) {
      throw AppError.notFound(`User not found with ID: ${id}`);
    }
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('User retrieved successfully', user)
    );
  });
}
