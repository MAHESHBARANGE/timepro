// src/app/components/auth/register/register.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  error = '';
  success = '';
  managers: any[] = [];

  departments = [
    'Engineering',
    'Design',
    'Marketing',
    'Sales',
    'HR',
    'Finance',
    'Operations',
    'Support',
  ];

  roles = [
    { value: 'employee', label: 'Employee' },
    { value: 'manager', label: 'Manager' },
    { value: 'admin', label: 'Admin' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        role: ['employee', [Validators.required]],
        department: ['', [Validators.required]],
        managerId: [''],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated() && this.authService.isAdmin()) {
      this.loadManagers();
    }

    this.registerForm.get('role')?.valueChanges.subscribe((role) => {
      const managerControl = this.registerForm.get('managerId');

      if (role === 'employee') {
        managerControl?.setValidators([Validators.required]);
      } else {
        managerControl?.clearValidators();
        managerControl?.setValue(null);
      }

      managerControl?.updateValueAndValidity();
    });
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  loadManagers(): void {
    // Load managers from API
    this.http.get<any>('http://localhost:5000/api/auth/users').subscribe({
      next: (response) => {
        this.managers = response.users.filter((u: any) => u.role === 'manager');
      },
      error: (error) => {
        console.error('Failed to load managers:', error);
      },
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const formData = { ...this.registerForm.value };
    delete formData.confirmPassword;
    if (!formData.managerId) {
      delete formData.managerId;
    }

    this.authService.register(formData).subscribe({
      next: (response) => {
        this.success = 'Registration successful! Redirecting...';
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Registration failed';
        this.loading = false;
      },
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get passwordMismatch(): boolean {
    return (
      (this.registerForm.hasError('passwordMismatch') &&
        this.registerForm.get('confirmPassword')?.touched) ||
      false
    );
  }
}
