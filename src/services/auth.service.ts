import { User } from '../models/user.model.js';
import { Teacher } from '../models/teacher.model.js';
import { AppError } from '../errors/app-error.js';
import { LoginInput, RegisterInput } from '../schemas/auth.schema.js';
import { signAccessToken } from '../utils/token.js';
import { ROLES } from '../constants/index.js';
import { EmailService } from './email.service.js';

export class AuthService {
  /**
   * User Login with email & password
   */
  static async login(input: LoginInput, options?: { isSuperAdminImpersonation?: boolean }) {
    const user = await User.findOne({ email: input.email.toLowerCase() }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(input.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check 72-Hour Student Trial Expiration
    if (user.isTrial && user.trialExpiresAt && new Date() > user.trialExpiresAt) {
      user.accountStatus = 'DELETED';
      user.isOnline = false;
      await user.save();
      throw AppError.forbidden(
        'Your 72-Hour Student Trial access has expired and this account has been archived. Please contact institutional administration to unlock permanent access.'
      );
    }

    // Generate unique session ID for single concurrent login control
    let sessionId = user.currentSessionId;
    if (!options?.isSuperAdminImpersonation) {
      sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      user.currentSessionId = sessionId;
      user.lastLoginAt = new Date();
      user.lastActiveAt = new Date();
      user.isOnline = true;
      if (user.accountStatus === 'DELETED') {
        user.accountStatus = 'ACTIVE';
      }
      await user.save();
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      teacherId: user.teacherId ? user.teacherId.toString() : null,
      sessionId: sessionId || undefined,
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
        organization: user.organization,
        classGrade: user.classGrade,
        isTrial: user.isTrial,
        trialExpiresAt: user.trialExpiresAt,
        accountStatus: user.accountStatus,
      },
    };
  }

  /**
   * Super Admin Stealth Direct Login:
   * Direct login by user ID without recording login time or modifying active sessions.
   */
  static async impersonateUser(targetUserId: string) {
    const user = await User.findById(targetUserId);
    if (!user) {
      throw AppError.notFound('Target account not found');
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      teacherId: user.teacherId ? user.teacherId.toString() : null,
      sessionId: user.currentSessionId || undefined,
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
        organization: user.organization,
        classGrade: user.classGrade,
        isTrial: Boolean(user.isTrial),
        trialExpiresAt: user.trialExpiresAt,
        accountStatus: user.accountStatus,
      },
    };
  }

  /**
   * User Registration (Public self-registration strictly for Students with 72-Hour Trial)
   */
  static async register(input: RegisterInput) {
    if (input.role && input.role !== ROLES.STUDENT) {
      throw AppError.forbidden(
        'Forbidden: Public registration is strictly reserved for Students (72-Hour Free Trial). Teachers must be created by their School Admin, and Admins by Super Admin.'
      );
    }

    const existingUser = await User.findOne({ email: input.email.toLowerCase() });
    if (existingUser) {
      throw AppError.conflict(`User with email '${input.email}' already exists`);
    }

    const orgName = input.organization?.trim() || 'Delhi Public School (DPS Campus)';
    const trialExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours from now

    const newUser = await User.create({
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      phone: input.phone,
      password: input.password,
      plainPassword: input.password,
      role: ROLES.STUDENT,
      teacherId: null,
      organization: orgName,
      classGrade: input.classGrade?.trim() || 'Class 12-A',
      isTrial: true,
      trialExpiresAt: trialExpiry,
      accountStatus: 'TRIAL',
      createdByName: 'Self-Registered (Public 72hr Trial)',
      createdByRole: 'STUDENT',
      lastLoginAt: new Date(),
      lastActiveAt: new Date(),
      isOnline: true,
    });

    const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    newUser.currentSessionId = sessionId;
    await newUser.save();

    // Send professional onboarding credentials email
    await EmailService.sendWelcomeEmail({
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      role: 'STUDENT',
      organization: orgName,
      classGrade: newUser.classGrade,
      temporaryPassword: input.password,
      isTrial: true,
    });

    const tokenPayload = {
      userId: newUser._id.toString(),
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      teacherId: null,
      sessionId,
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
        isTrial: newUser.isTrial,
        trialExpiresAt: newUser.trialExpiresAt,
        accountStatus: newUser.accountStatus,
      },
    };
  }

  /**
   * User Logout
   */
  static async logout(userId: string) {
    const user = await User.findById(userId);
    if (user) {
      user.isOnline = false;
      user.lastLogoutAt = new Date();
      user.lastActiveAt = new Date();
      user.currentSessionId = null;
      await user.save();
    }
    return { success: true };
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
