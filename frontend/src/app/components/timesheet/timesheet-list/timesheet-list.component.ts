import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TimesheetService } from '../../../services/timesheet.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-timesheet-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './timesheet-list.component.html',
  styleUrls: ['./timesheet-list.component.scss'],
})
export class TimesheetListComponent implements OnInit {
  timesheets: any[] = [];
  filteredTimesheets: any[] = [];
  loading = true;
  filterStatus = 'all';
  searchTerm = '';

  constructor(
    public timesheetService: TimesheetService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadTimesheets();
  }

  loadTimesheets(): void {
    this.loading = true;
    this.timesheetService.getMyTimesheets().subscribe({
      next: (response) => {
        this.timesheets = response.timesheets;
        this.filteredTimesheets = [...this.timesheets];
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load timesheets:', error);
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    this.filteredTimesheets = this.timesheets.filter((timesheet) => {
      const matchesStatus =
        this.filterStatus === 'all' || timesheet.status === this.filterStatus;
      const matchesSearch =
        this.searchTerm === '' ||
        this.getWeekDisplay(timesheet)
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
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

  getStatusIcon(status: string): string {
    const icons: any = {
      draft: '📝',
      submitted: '📤',
      approved: '✅',
      rejected: '❌',
    };
    return icons[status] || '📋';
  }

  getWeekDisplay(timesheet: any): string {
    const start = new Date(timesheet.weekStartDate);
    const end = new Date(timesheet.weekEndDate);
    return `${start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} - ${end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;
  }

  exportTimesheet(timesheetId: string): void {
    this.timesheetService.exportToPDF(timesheetId);
  }

  deleteTimesheet(timesheetId: string): void {
    if (confirm('Are you sure you want to delete this timesheet?')) {
      // Implement delete functionality
      console.log('Delete timesheet:', timesheetId);
    }
  }

  getProgressWidth(timesheet: any): number {
    const max = 40; // 40 hours per week is 100%
    return Math.min((timesheet.totalHours / max) * 100, 100);
  }

  getProgressColor(timesheet: any): string {
    const hours = timesheet.totalHours;
    if (hours < 30) return '#ffc107'; // warning
    if (hours >= 30 && hours <= 45) return '#28a745'; // success
    return '#dc3545'; // danger (overwork)
  }

  getTotalTimesheets(): number {
    return this.timesheets.length;
  }

  getTotalHours(): number {
    return this.timesheets.reduce((sum, t) => sum + t.totalHours, 0);
  }

  getApprovedCount(): number {
    return this.timesheets.filter((t) => t.status === 'approved').length;
  }

  getSubmittedCount(): number {
    return this.timesheets.filter((t) => t.status === 'submitted').length;
  }
}
