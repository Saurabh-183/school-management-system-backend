import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { HTTP_STATUS } from '../constants/index.js';
import { asyncHandler } from '../utils/async-handler.js';

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
}
