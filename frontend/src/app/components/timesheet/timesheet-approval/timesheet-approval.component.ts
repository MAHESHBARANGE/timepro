// src/app/components/timesheet/timesheet-approval/timesheet-approval.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimesheetService } from '../../../services/timesheet.service';
import { TimesheetReview } from '../../../models/timesheet';

@Component({
  selector: 'app-timesheet-approval',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './timesheet-approval.component.html',
  styleUrls: ['./timesheet-approval.component.scss'],
})
export class TimesheetApprovalComponent implements OnInit {
  pendingTimesheets: any[] = [];
  loading = true;
  selectedTimesheet: any = null;
  showReviewModal = false;
  reviewAction: 'approve' | 'reject' | null = null;
  rejectionReason = '';
  processing = false;

  constructor(private timesheetService: TimesheetService) {}

  ngOnInit(): void {
    this.loadPendingTimesheets();
  }

  loadPendingTimesheets(): void {
    this.loading = true;
    this.timesheetService.getPendingTimesheets().subscribe({
      next: (response) => {
        this.pendingTimesheets = response.timesheets;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load pending timesheets:', error);
        this.loading = false;
      },
    });
  }

  openReviewModal(timesheet: any, action: 'approve' | 'reject'): void {
    this.selectedTimesheet = timesheet;
    this.reviewAction = action;
    this.rejectionReason = '';
    this.showReviewModal = true;
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.selectedTimesheet = null;
    this.reviewAction = null;
    this.rejectionReason = '';
  }

  confirmReview(): void {
    if (!this.selectedTimesheet || !this.reviewAction) return;

    if (this.reviewAction === 'reject' && !this.rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    this.processing = true;

    const reviewData: TimesheetReview = {
      status: this.reviewAction === 'approve' ? 'approved' : 'rejected',
      rejectionReason:
        this.reviewAction === 'reject' ? this.rejectionReason : undefined,
    };

    this.timesheetService
      .reviewTimesheet(this.selectedTimesheet._id, reviewData)
      .subscribe({
        next: (response) => {
          this.processing = false;
          this.closeReviewModal();
          this.loadPendingTimesheets();
          alert(`Timesheet ${this.reviewAction}d successfully!`);
        },
        error: (error) => {
          this.processing = false;
          alert(`Failed to ${this.reviewAction} timesheet`);
        },
      });
  }

  viewDetails(timesheet: any): void {
    this.selectedTimesheet = timesheet;
    // You can show a detail modal here
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

  getTotalDays(timesheet: any): number {
    return timesheet.entries.length;
  }

  getAverageHoursPerDay(timesheet: any): number {
    if (timesheet.entries.length === 0) return 0;
    return (
      Math.round((timesheet.totalHours / timesheet.entries.length) * 10) / 10
    );
  }

  isOverworked(timesheet: any): boolean {
    return timesheet.totalHours > 50; // More than 50 hours per week
  }

  exportTimesheet(timesheetId: string): void {
    this.timesheetService.exportToPDF(timesheetId);
  }
}
