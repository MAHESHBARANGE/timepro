import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TimesheetService } from '../../../services/timesheet.service';

@Component({
  selector: 'app-timesheet-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './timesheet-form.component.html',
  styleUrls: ['./timesheet-form.component.scss'],
})
export class TimesheetFormComponent implements OnInit {
  timesheetForm: FormGroup;
  weekDates: Date[] = [];
  currentWeekStart: Date;
  currentWeekEnd!: Date;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private timesheetService: TimesheetService,
    private router: Router
  ) {
    this.currentWeekStart = this.timesheetService.getWeekStartDate(new Date());
    this.updateWeekDates();
    this.weekDates = this.timesheetService.getWeekDates(this.currentWeekStart);

    this.timesheetForm = this.fb.group({
      weekStartDate: [this.currentWeekStart],
      entries: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.initializeEntries();
  }

  get entries(): FormArray {
    return this.timesheetForm.get('entries') as FormArray;
  }

  initializeEntries(): void {
    this.weekDates.forEach((date) => {
      this.entries.push(this.createEntryGroup(date));
    });
  }

  createEntryGroup(date: Date): FormGroup {
    const isCurrentMonth = this.timesheetService.isDateInCurrentMonth(date);

    return this.fb.group({
      date: [{ value: date, disabled: !isCurrentMonth }],
      hours: [
        { value: 0, disabled: !isCurrentMonth },
        [Validators.required, Validators.min(0), Validators.max(24)],
      ],
      projectName: [{ value: '', disabled: !isCurrentMonth }],
      taskDescription: [{ value: '', disabled: !isCurrentMonth }],
      status: [{ value: 'completed', disabled: !isCurrentMonth }],
    });
  }

  getTotalHours(): number {
    return this.entries.controls.reduce((sum, control) => {
      return sum + (parseFloat(control.get('hours')?.value) || 0);
    }, 0);
  }

  previousWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.resetEntries();
  }

  nextWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.resetEntries();
  }

  resetEntries(): void {
    this.updateWeekDates();
    this.entries.clear();
    this.initializeEntries();
    this.timesheetForm.patchValue({ weekStartDate: this.currentWeekStart });
  }

  onSubmit(submit: boolean = false): void {
    if (this.timesheetForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = {
      weekStartDate: this.currentWeekStart,
      entries: this.entries.getRawValue().filter((e: any) => e.hours > 0),
    };

    this.timesheetService.createOrUpdateTimesheet(formData).subscribe({
      next: (response) => {
        this.successMessage = 'Timesheet saved successfully!';

        if (submit) {
          this.timesheetService
            .submitTimesheet(response.timesheet._id)
            .subscribe({
              next: () => {
                this.router.navigate(['/timesheets']);
              },
            });
        } else {
          this.loading = false;
        }
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to save timesheet';
        this.loading = false;
      },
    });
  }

  onSubmitForApproval(): void {
    this.onSubmit(true);
  }

  getDayName(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  getDateString(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  updateWeekDates(): void {
    this.weekDates = this.timesheetService.getWeekDates(this.currentWeekStart);

    this.currentWeekEnd = new Date(this.currentWeekStart);
    this.currentWeekEnd.setDate(this.currentWeekStart.getDate() + 6);
  }

  goBack(): void {
    this.router.navigate(['/timesheets']);
  }
}
