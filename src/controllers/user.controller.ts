import { Request, Response } from 'express';
import { UserService } from '../services/user.service.js';
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
    const user = await UserService.createUser(req.body);
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
   * Helper: Get All Users
   * GET /users
   */
  static getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
    const users = await UserService.getAllUsers();
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
