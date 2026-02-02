import { User } from './user';

// src/app/models/analytics.ts
export interface DashboardStats {
  totalTimesheets: number;
  totalHours: number;
  avgHoursPerWeek: number;
  statusCounts: {
    draft: number;
    submitted: number;
    approved: number;
    rejected: number;
  };
  departmentHours: { [key: string]: number };
}

export interface OverworkedEmployee {
  user: User;
  avgHoursPerWeek: number;
  totalHours: number;
  weekCount: number;
  maxWeekHours: number;
  risk: 'normal' | 'moderate' | 'high' | 'critical';
  suggestions: string[];
  weeksAnalyzed: Array<{
    weekStart: Date;
    hours: number;
  }>;
}

export interface WeeklyTrend {
  week: string;
  totalHours: number;
  timesheetCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}
