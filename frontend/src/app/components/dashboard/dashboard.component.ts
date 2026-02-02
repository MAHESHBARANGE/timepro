import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

import { AuthService } from '../../services/auth.service';
import { AnalyticsService } from '../../services/analytics.service';
import { TimesheetService } from '../../services/timesheet.service';
import { User } from '../../models/user';
import { DashboardStats } from '../../models/analytics';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  stats: DashboardStats | null = null;
  weeklyTrend: any[] = [];
  recentTimesheets: any[] = [];
  loading = true;

  // Chart configurations
  public statusChartData: ChartConfiguration<'pie'>['data'] | null = null;
  public statusChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  public trendChartData: ChartConfiguration<'line'>['data'] | null = null;
  public trendChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  constructor(
    public authService: AuthService,
    private analyticsService: AnalyticsService,
    private timesheetService: TimesheetService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    this.loadDashboardData();
  }

  loadDashboardData(): void {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Load stats
    this.analyticsService.getDashboardStats(year, month).subscribe({
      next: (response) => {
        this.stats = response.stats;
        this.prepareStatusChart();
      },
    });

    // Load weekly trend
    this.analyticsService.getWeeklyTrend(8).subscribe({
      next: (response) => {
        this.weeklyTrend = response.trend;
        this.prepareTrendChart();
      },
    });

    // Load recent timesheets
    this.timesheetService.getMyTimesheets().subscribe({
      next: (response) => {
        this.recentTimesheets = response.timesheets.slice(0, 5);
        this.loading = false;
      },
    });
  }

  prepareStatusChart(): void {
    if (!this.stats) return;

    this.statusChartData = {
      labels: ['Draft', 'Submitted', 'Approved', 'Rejected'],
      datasets: [
        {
          data: [
            this.stats.statusCounts.draft,
            this.stats.statusCounts.submitted,
            this.stats.statusCounts.approved,
            this.stats.statusCounts.rejected,
          ],
          backgroundColor: ['#ffc107', '#17a2b8', '#28a745', '#dc3545'],
        },
      ],
    };
  }

  prepareTrendChart(): void {
    this.trendChartData = {
      labels: this.weeklyTrend.map((w) =>
        new Date(w.week).toLocaleDateString('en', {
          month: 'short',
          day: 'numeric',
        })
      ),
      datasets: [
        {
          label: 'Hours Worked',
          data: this.weeklyTrend.map((w) => w.totalHours),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }

  getStatusBadgeClass(status: string): string {
    const classes: any = {
      draft: 'badge-warning',
      submitted: 'badge-info',
      approved: 'badge-success',
      rejected: 'badge-danger',
    };
    return classes[status] || 'badge-secondary';
  }
}
