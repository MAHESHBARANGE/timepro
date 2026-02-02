// src/app/services/analytics.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DashboardStats,
  OverworkedEmployee,
  WeeklyTrend,
} from '../models/analytics';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly API_URL = 'http://localhost:5000/api/analytics';

  constructor(private http: HttpClient) {}

  getDashboardStats(year?: number, month?: number): Observable<any> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    if (month) params = params.set('month', month.toString());
    return this.http.get(`${this.API_URL}/dashboard`, { params });
  }

  detectOverworkedEmployees(weeks: number = 4): Observable<any> {
    const params = new HttpParams().set('weeks', weeks.toString());
    return this.http.get(`${this.API_URL}/overworked`, { params });
  }

  getWeeklyTrend(weeks: number = 12): Observable<any> {
    const params = new HttpParams().set('weeks', weeks.toString());
    return this.http.get(`${this.API_URL}/trend`, { params });
  }
}
