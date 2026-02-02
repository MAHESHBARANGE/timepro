import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from '../../../services/analytics.service';
import { OverworkedEmployee } from '../../../models/analytics';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-productivity-analytics',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './productivity-analytics.component.html',
  styleUrl: './productivity-analytics.component.scss',
})
export class ProductivityAnalyticsComponent implements OnInit {
  overworkedEmployees: OverworkedEmployee[] = [];
  loading = true;
  weeks = 4;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading = true;
    this.analyticsService.detectOverworkedEmployees(this.weeks).subscribe({
      next: (response) => {
        this.overworkedEmployees = response.employees;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load analytics:', error);
        this.loading = false;
      },
    });
  }

  onWeeksChange(): void {
    this.loadAnalytics();
  }

  getRiskColor(risk: string): string {
    const colors: any = {
      critical: '#dc3545',
      high: '#fd7e14',
      moderate: '#ffc107',
      normal: '#28a745',
    };
    return colors[risk] || '#6c757d';
  }

  getRiskIcon(risk: string): string {
    const icons: any = {
      critical: '🔴',
      high: '🟠',
      moderate: '🟡',
      normal: '🟢',
    };
    return icons[risk] || '⚪';
  }

  exportReport(): void {
    // Simple CSV export
    const headers = [
      'Employee',
      'Department',
      'Avg Hours/Week',
      'Total Hours',
      'Risk Level',
    ];
    const rows = this.overworkedEmployees.map((emp) => [
      emp.user.name,
      emp.user.department,
      emp.avgHoursPerWeek.toString(),
      emp.totalHours.toString(),
      emp.risk,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `overworked-employees-${new Date().toISOString()}.csv`;
    a.click();
  }
}
