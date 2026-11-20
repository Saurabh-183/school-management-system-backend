import { Schema, model, Document, Types } from 'mongoose';
import { SESSION_STATUS, SessionStatus } from '../constants/index.js';

export interface ILectureNote {
  _id?: Types.ObjectId;
  title: string;
  content: string;
  authorName?: string;
  createdAt?: Date;
}

export interface IVideoLecture {
  _id?: Types.ObjectId;
  title: string;
  videoUrl: string;
  duration?: string;
  description?: string;
  uploadedAt?: Date;
}

export interface ISubjectDocument {
  _id?: Types.ObjectId;
  title: string;
  fileUrl: string;
  fileType: string;
  fileSize?: string;
  uploadedAt?: Date;
}

export interface ISession extends Document {
  teacherId: Types.ObjectId;
  userId: Types.ObjectId | null;
  startTime: Date;
  endTime: Date;
  status: SessionStatus;
  completedAt: Date | null;
  notes: ILectureNote[];
  videoLectures: IVideoLecture[];
  documents: ISubjectDocument[];
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
    notes: [
      {
        title: { type: String, required: true },
        content: { type: String, required: true },
        authorName: { type: String, default: 'Assigned Mentor' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    videoLectures: [
      {
        title: { type: String, required: true },
        videoUrl: { type: String, required: true },
        duration: { type: String, default: '45 mins' },
        description: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    documents: [
      {
        title: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileType: { type: String, default: 'PDF' },
        fileSize: { type: String, default: '2.4 MB' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
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
