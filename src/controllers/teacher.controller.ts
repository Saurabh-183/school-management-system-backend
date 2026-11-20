import { Request, Response } from 'express';
import { TeacherService } from '../services/teacher.service.js';
import { User } from '../models/user.model.js';
import { ApiResponse } from '../utils/api-response.js';
import { HTTP_STATUS } from '../constants/index.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../errors/app-error.js';

export class TeacherController {
  static createTeacher = asyncHandler(async (req: Request, res: Response) => {
    const teacher = await TeacherService.createTeacher(req.body);
    res.status(HTTP_STATUS.CREATED).json(
      ApiResponse.success('Teacher created successfully', teacher)
    );
  });

  static getAllTeachers = asyncHandler(async (req: Request, res: Response) => {
    let filter;
    if (req.user) {
      const userDoc = await User.findById(req.user.userId);
      filter = {
        organization: userDoc?.organization,
        createdBy: req.user.userId,
        role: req.user.role,
      };
    }
    const teachers = await TeacherService.getAllTeachers(filter);
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('Teachers retrieved successfully', teachers)
    );
  });

  static getTeacherById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const teacher = await TeacherService.getTeacherById(id);
    if (!teacher) {
      throw AppError.notFound(`Teacher not found with ID: ${id}`);
    }
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('Teacher retrieved successfully', teacher)
    );
  });

  static getTeacherSessions = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await TeacherService.getTeacherSessions(id);
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success('Teacher schedule and sessions retrieved successfully', data)
    );
  });
}
