// src/app/services/timesheet.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Timesheet, TimesheetReview } from '../models/timesheet';

@Injectable({
  providedIn: 'root'
})
export class TimesheetService {
  private readonly API_URL = 'http://localhost:5000/api/timesheets';

  constructor(private http: HttpClient) {}

  createOrUpdateTimesheet(data: any): Observable<any> {
    return this.http.post(`${this.API_URL}`, data);
  }

  getMyTimesheets(startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get(`${this.API_URL}/my`, { params });
  }

  getTimesheetById(id: string): Observable<any> {
    return this.http.get(`${this.API_URL}/${id}`);
  }

  submitTimesheet(id: string): Observable<any> {
    return this.http.patch(`${this.API_URL}/${id}/submit`, {});
  }

  reviewTimesheet(id: string, review: TimesheetReview): Observable<any> {
    return this.http.patch(`${this.API_URL}/${id}/review`, review);
  }

  getPendingTimesheets(): Observable<any> {
    return this.http.get(`${this.API_URL}/pending`);
  }

  exportToExcel(startDate?: string, endDate?: string, userId?: string): void {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (userId) params = params.set('userId', userId);

    window.open(`http://localhost:5000/api/export/excel?${params.toString()}`, '_blank');
  }

  exportToPDF(timesheetId: string): void {
    window.open(`http://localhost:5000/api/export/pdf/${timesheetId}`, '_blank');
  }

  // Utility: Get week start date (Monday)
  getWeekStartDate(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  // Utility: Get dates for the week
  getWeekDates(weekStart: Date): Date[] {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  // Utility: Check if date is in current month
  isDateInCurrentMonth(date: Date): boolean {
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
}