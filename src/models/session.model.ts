import { Schema, model, Document, Types } from 'mongoose';
import { SESSION_STATUS, SessionStatus } from '../constants/index.js';

export interface ISession extends Document {
  teacherId: Types.ObjectId;
  userId: Types.ObjectId | null;
  startTime: Date;
  endTime: Date;
  status: SessionStatus;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Teacher ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
      index: true,
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(SESSION_STATUS),
        message: 'Status must be one of: AVAILABLE, BOOKED, COMPLETED',
      },
      default: SESSION_STATUS.AVAILABLE,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete (ret as Record<string, unknown>).__v;
        return ret;
      },
    },
  }
);

// Compound index for querying teacher schedule efficiently
sessionSchema.index({ teacherId: 1, startTime: 1, endTime: 1 });
// Compound index for finding available sessions by date and status
sessionSchema.index({ status: 1, startTime: 1 });
// Compound index for user session queries
sessionSchema.index({ userId: 1, status: 1 });

export const Session = model<ISession>('Session', sessionSchema);
