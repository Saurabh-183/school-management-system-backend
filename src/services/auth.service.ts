import { User } from '../models/user.model.js';
import { Teacher } from '../models/teacher.model.js';
import { AppError } from '../errors/app-error.js';
import { LoginInput, RegisterInput } from '../schemas/auth.schema.js';
import { signAccessToken } from '../utils/token.js';
import { ROLES } from '../constants/index.js';

export class AuthService {
  /**
   * User Login with email & password
   */
  static async login(input: LoginInput) {
    const user = await User.findOne({ email: input.email.toLowerCase() }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(input.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      teacherId: user.teacherId ? user.teacherId.toString() : null,
    };

    const accessToken = signAccessToken(tokenPayload);

    return {
      accessToken,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        teacherId: user.teacherId,
      },
    };
  }

  /**
   * User Registration (Public self-registration for Students and Teachers only)
   */
  static async register(input: RegisterInput) {
    if ((input.role as string) === ROLES.ADMIN || (input.role as string) === ROLES.SUPER_ADMIN) {
      throw AppError.forbidden(
        'Forbidden: Administrative accounts cannot be self-registered. Only Super Admins can provision organization administrators.'
      );
    }

    const existingUser = await User.findOne({ email: input.email.toLowerCase() });
    if (existingUser) {
      throw AppError.conflict(`User with email '${input.email}' already exists`);
    }

    const orgName = input.organization?.trim() || 'Delhi Public School (DPS Campus)';
    let linkedTeacherId = input.teacherId || null;

    // If registering as a teacher and no teacherId provided, auto-create a Teacher record
    if (input.role === ROLES.TEACHER && !linkedTeacherId) {
      const teacher = await Teacher.create({
        fullName: input.fullName,
        email: input.email.toLowerCase(),
        specialization: input.specialization?.trim() || 'Full Stack Development & System Design',
        experience: input.experience ?? 5,
        organization: orgName,
        assignedClasses: ['Class 11-A', 'Class 12-A'],
      });
      linkedTeacherId = teacher._id.toString();
    }

    const newUser = await User.create({
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      phone: input.phone,
      password: input.password,
      role: input.role || ROLES.STUDENT,
      teacherId: linkedTeacherId,
      organization: orgName,
      classGrade: input.classGrade?.trim() || 'Class 12-A',
    });

    const tokenPayload = {
      userId: newUser._id.toString(),
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      teacherId: newUser.teacherId ? newUser.teacherId.toString() : null,
    };

    const accessToken = signAccessToken(tokenPayload);

    return {
      accessToken,
      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        teacherId: newUser.teacherId,
        organization: newUser.organization,
        classGrade: newUser.classGrade,
      },
    };
  }

  /**
   * Get authenticated user profile
   */
  static async getCurrentUser(userId: string) {
    const user = await User.findById(userId).populate('teacherId');
    if (!user) {
      throw AppError.notFound('User profile not found');
    }
    return user;
  }
}
