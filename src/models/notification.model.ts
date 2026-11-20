import mongoose, { Schema, Document, Types } from 'mongoose';

export type NotificationType =
  | 'ACADEMIC_RESOURCE'  // Notes, video, or documents uploaded by teacher
  | 'ADMIN_UPDATE'       // Admin created/updated teacher or class allocations
  | 'SESSION_BOOKED'     // Student booked a session
  | 'SESSION_SCHEDULED'  // Teacher/Admin created a new session
  | 'SESSION_COMPLETED'  // Session marked complete
  | 'SYSTEM';            // Platform system alert

export interface INotification extends Document {
  recipientId: Types.ObjectId;
  senderId?: Types.ObjectId | null;
  senderName: string;
  senderRole?: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedSessionId?: Types.ObjectId | null;
  relatedResourceType?: 'notes' | 'video' | 'document' | 'session' | 'teacher' | null;
  targetTab?: string | null;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
      default: 'System',
    },
    senderRole: {
      type: String,
      default: 'SYSTEM',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['ACADEMIC_RESOURCE', 'ADMIN_UPDATE', 'SESSION_BOOKED', 'SESSION_SCHEDULED', 'SESSION_COMPLETED', 'SYSTEM'],
      default: 'SYSTEM',
      index: true,
    },
    relatedSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
      index: true,
    },
    relatedResourceType: {
      type: String,
      default: null,
    },
    targetTab: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast user notification lookups
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
