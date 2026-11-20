import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { HTTP_STATUS } from '../constants/index.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../errors/app-error.js';

export class AuthController {
  static login = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('Login successful', result)
    );
  });

  static register = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);
    res.status(HTTP_STATUS.CREATED).json(
      ApiResponse.success('Registration successful', result)
    );
  });

  static getMe = asyncHandler(async (req: Request, res: Response) => {
    const user = await AuthService.getCurrentUser(req.user!.userId);
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('Current user profile retrieved', user)
    );
  });

  static logout = asyncHandler(async (req: Request, res: Response) => {
    if (req.user?.userId) {
      await AuthService.logout(req.user.userId);
    }
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('Logged out successfully', null)
    );
  });

  static impersonateLogin = asyncHandler(async (req: Request, res: Response) => {
    let result;
    if (req.body.targetUserId) {
      result = await AuthService.impersonateUser(req.body.targetUserId);
    } else if (req.body.email && req.body.password) {
      result = await AuthService.login(req.body, { isSuperAdminImpersonation: true });
    } else {
      throw AppError.badRequest('targetUserId or email/password is required');
    }
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('Direct login successful (activity not recorded)', result)
    );
  });
}
