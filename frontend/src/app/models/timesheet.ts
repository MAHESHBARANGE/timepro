import { User } from "./user";

// src/app/models/timesheet.ts
export interface TimesheetEntry {
  date: Date;
  hours: number;
  projectName: string;
  taskDescription: string;
  status: 'completed' | 'in-progress' | 'blocked';
}

export interface Timesheet {
  _id?: string;
  userId: string | User;
  weekStartDate: Date;
  weekEndDate: Date;
  entries: TimesheetEntry[];
  totalHours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string | User;
  rejectionReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TimesheetReview {
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}