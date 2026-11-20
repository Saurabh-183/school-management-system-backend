import { Types } from 'mongoose';
import { Notification, INotification, NotificationType } from '../models/notification.model.js';
import { User } from '../models/user.model.js';
import { Session } from '../models/session.model.js';
import { Teacher } from '../models/teacher.model.js';
import { ROLES } from '../constants/index.js';

export class NotificationService {
  /**
   * Get all notifications for a specific user
   */
  static async getUserNotifications(userId: string, limit = 30) {
    if (!Types.ObjectId.isValid(userId)) {
      return { notifications: [], unreadCount: 0 };
    }

    const userObjectId = new Types.ObjectId(userId);

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipientId: userObjectId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipientId: userObjectId, isRead: false }),
    ]);

    return {
      notifications,
      unreadCount,
    };
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    if (!Types.ObjectId.isValid(notificationId)) {
      return null;
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: new Types.ObjectId(notificationId),
        recipientId: new Types.ObjectId(userId),
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
      { new: true }
    );

    return notification;
  }

  /**
   * Mark all notifications for a user as read
   */
  static async markAllAsRead(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      return { modifiedCount: 0 };
    }

    const result = await Notification.updateMany(
      {
        recipientId: new Types.ObjectId(userId),
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Low-level helper to create and persist a notification
   */
  static async createNotification(data: {
    recipientId: Types.ObjectId | string;
    senderId?: Types.ObjectId | string | null;
    senderName?: string;
    senderRole?: string;
    title: string;
    message: string;
    type?: NotificationType;
    relatedSessionId?: Types.ObjectId | string | null;
    relatedResourceType?: 'notes' | 'video' | 'document' | 'session' | 'teacher' | null;
    targetTab?: string | null;
    metadata?: Record<string, any>;
  }) {
    try {
      const notification = await Notification.create({
        recipientId: new Types.ObjectId(data.recipientId),
        senderId: data.senderId ? new Types.ObjectId(data.senderId) : null,
        senderName: data.senderName || 'System Notification',
        senderRole: data.senderRole || 'SYSTEM',
        title: data.title,
        message: data.message,
        type: data.type || 'SYSTEM',
        relatedSessionId: data.relatedSessionId ? new Types.ObjectId(data.relatedSessionId) : null,
        relatedResourceType: data.relatedResourceType || null,
        targetTab: data.targetTab || null,
        metadata: data.metadata || {},
        isRead: false,
      });
      return notification;
    } catch (err) {
      console.error('[NotificationService Error] Failed to create notification:', err);
      return null;
    }
  }

  /**
   * Flow 1: When a Teacher posts/uploads lecture notes, videos, or subject documents,
   * notify all relevant students under their organization / enrolled in the session.
   */
  static async notifyStudentsForTeacherUpload(params: {
    sessionId: string;
    resourceType: 'notes' | 'video' | 'document';
    resourceTitle: string;
    authorName?: string;
    authorUserId?: string;
  }) {
    try {
      const session = await Session.findById(params.sessionId).populate('teacherId');
      if (!session) return;

      const teacherObj: any = session.teacherId;
      const teacherName = params.authorName || teacherObj?.fullName || 'Assigned Mentor';
      const specialization = teacherObj?.specialization || 'Course';
      const org = teacherObj?.organization;

      let icon = '📝';
      let typeLabel = 'Lecture Notes';
      let tabKey = 'notes';

      if (params.resourceType === 'video') {
        icon = '📹';
        typeLabel = 'Video Lecture';
        tabKey = 'videos';
      } else if (params.resourceType === 'document') {
        icon = '📑';
        typeLabel = 'Subject Document';
        tabKey = 'documents';
      }

      const notifTitle = `${icon} New ${typeLabel}: ${params.resourceTitle}`;
      const notifMessage = `Mentor ${teacherName} uploaded new ${typeLabel.toLowerCase()} for "${specialization}". Click to access in-app study materials.`;

      // Target students: if session is booked by a student, definitely notify them!
      // Also notify active students in the same organization / general student pool.
      const studentQuery: any = { role: ROLES.STUDENT, accountStatus: 'ACTIVE' };
      if (org) {
        studentQuery.$or = [{ organization: org }, { organization: 'Self-Registered Web Trial' }];
      }

      const targetStudents = await User.find(studentQuery).limit(50).select('_id fullName email');

      const notificationsToInsert = targetStudents.map((st) => ({
        recipientId: st._id,
        senderId: params.authorUserId ? new Types.ObjectId(params.authorUserId) : null,
        senderName: `${teacherName} (Teacher)`,
        senderRole: 'TEACHER',
        title: notifTitle,
        message: notifMessage,
        type: 'ACADEMIC_RESOURCE' as NotificationType,
        relatedSessionId: session._id,
        relatedResourceType: params.resourceType,
        targetTab: tabKey,
        metadata: {
          sessionId: session._id.toString(),
          specialization,
          resourceTitle: params.resourceTitle,
        },
        isRead: false,
      }));

      if (notificationsToInsert.length > 0) {
        await Notification.insertMany(notificationsToInsert);
      }
    } catch (err) {
      console.error('[NotificationService Error] notifyStudentsForTeacherUpload failed:', err);
    }
  }

  /**
   * Flow 2: When an Admin creates, edits, or assigns updates to a particular Teacher,
   * notify that teacher immediately.
   */
  static async notifyTeacherForAdminUpdate(params: {
    teacherUserId: string;
    adminName: string;
    adminUserId?: string;
    adminRole?: string;
    title: string;
    message: string;
    targetTab?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      return await this.createNotification({
        recipientId: params.teacherUserId,
        senderId: params.adminUserId,
        senderName: `${params.adminName} (Administration)`,
        senderRole: params.adminRole || 'ADMIN',
        title: `🏛️ ${params.title}`,
        message: params.message,
        type: 'ADMIN_UPDATE',
        targetTab: params.targetTab || 'schedule',
        metadata: params.metadata || {},
      });
    } catch (err) {
      console.error('[NotificationService Error] notifyTeacherForAdminUpdate failed:', err);
      return null;
    }
  }

  /**
   * Flow 3: When a session is booked, notify both the Teacher and the Student
   */
  static async notifyForSessionBooking(sessionId: string, studentUserId: string) {
    try {
      const session = await Session.findById(sessionId).populate('teacherId');
      const student = await User.findById(studentUserId);
      if (!session || !student) return;

      const teacherObj: any = session.teacherId;
      const teacherName = teacherObj?.fullName || 'Assigned Mentor';

      // 1. Notify Teacher
      const teacherUser = await User.findOne({
        $or: [
          { teacherId: teacherObj?._id },
          { email: teacherObj?.email },
        ],
      });

      if (teacherUser) {
        await this.createNotification({
          recipientId: teacherUser._id,
          senderId: student._id,
          senderName: `${student.fullName} (Student)`,
          senderRole: 'STUDENT',
          title: `📅 New Booking Confirmed: ${student.fullName}`,
          message: `${student.fullName} booked your upcoming session scheduled for ${new Date(session.startTime).toUTCString()}.`,
          type: 'SESSION_BOOKED',
          relatedSessionId: session._id,
          targetTab: 'schedule',
        });
      }

      // 2. Notify Student
      await this.createNotification({
        recipientId: student._id,
        senderId: teacherUser?._id || null,
        senderName: `${teacherName} (Teacher)`,
        senderRole: 'TEACHER',
        title: `✅ Session Reservation Confirmed: ${teacherObj?.specialization || 'Mentorship'}`,
        message: `Your booking with ${teacherName} is confirmed for ${new Date(session.startTime).toUTCString()}.`,
        type: 'SESSION_BOOKED',
        relatedSessionId: session._id,
        targetTab: 'available',
      });
    } catch (err) {
      console.error('[NotificationService Error] notifyForSessionBooking failed:', err);
    }
  }

  /**
   * Flow 4: When a session is completed, notify the student
   */
  static async notifyStudentForSessionCompletion(sessionId: string) {
    try {
      const session = await Session.findById(sessionId).populate('teacherId');
      if (!session || !session.userId) return;

      const teacherObj: any = session.teacherId;
      const teacherName = teacherObj?.fullName || 'Mentor';

      await this.createNotification({
        recipientId: session.userId,
        senderName: `${teacherName} (Teacher)`,
        senderRole: 'TEACHER',
        title: `🎓 Session Completed: ${teacherObj?.specialization || 'Class'}`,
        message: `Your mentorship session with ${teacherName} has concluded. Review lecture notes and materials in your learning schedule.`,
        type: 'SESSION_COMPLETED',
        relatedSessionId: session._id,
        targetTab: 'schedule',
      });
    } catch (err) {
      console.error('[NotificationService Error] notifyStudentForSessionCompletion failed:', err);
    }
  }
}
