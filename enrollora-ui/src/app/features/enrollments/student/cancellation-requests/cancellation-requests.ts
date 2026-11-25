
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { CancellationStatus } from '../../enrollment.models';
import { CancellationResponse } from '../../enrollment.models';
import { CancellationService } from '../../cancellation.service';
import { EnrollmentService } from '../../enrollment.service';
import { EnrollmentResponse } from '../../enrollment.models';

@Component({
  selector: 'app-student-cancellation-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cancellation-requests.html',
  styleUrl: './cancellation-requests.css',
})
export class CancellationRequestsComponent implements OnInit {
  private readonly cancellationService = inject(CancellationService);
  private readonly enrollmentService = inject(EnrollmentService);

  requests = signal<CancellationResponse[]>([]);
  activeEnrollments = signal<EnrollmentResponse[]>([]);

  isLoading = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  selectedEnrollmentId: number | null = null;
  reason = '';

  readonly CancellationStatus = CancellationStatus;

  ngOnInit(): void {
    this.loadRequests();
    this.loadActiveEnrollments();
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.cancellationService
      .getMyCancellationRequests(1, 100)
      .subscribe({
        next: (response) => {
          this.requests.set(response.items);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.detail ||
            error.error?.message ||
            'Unable to load cancellation requests.',
          );
          this.isLoading.set(false);
        },
      });
  }

  loadActiveEnrollments(): void {
    this.enrollmentService.getMyEnrollments(1, 100).subscribe({
      next: (response) => {
        this.activeEnrollments.set(
          response.items.filter((item) => item.status === 0),
        );
      },
      error: (error) => {
        console.error('Unable to load active enrollments:', error);
      },
    });
  }

  submitRequest(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.selectedEnrollmentId) {
      this.errorMessage.set('Please select a course.');
      return;
    }

    if (!this.reason.trim()) {
      this.errorMessage.set('Please enter a cancellation reason.');
      return;
    }

    const existingPendingRequest = this.requests().some(
      (request) =>
        request.enrollmentId === this.selectedEnrollmentId &&
        request.status === CancellationStatus.Pending,
    );

    if (existingPendingRequest) {
      this.errorMessage.set(
        'A pending cancellation request already exists for this course.',
      );
      return;
    }

    this.isSubmitting.set(true);

    this.cancellationService
      .createCancellationRequest(this.selectedEnrollmentId, {
        reason: this.reason.trim(),
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.successMessage.set(
            'Cancellation request submitted successfully.',
          );
          this.reason = '';
          this.selectedEnrollmentId = null;

          this.loadRequests();
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(
            error.error?.detail ||
            error.error?.message ||
            error.error?.title ||
            'Unable to submit cancellation request.',
          );
        },
      });
  }

  statusLabel(status: CancellationStatus): string {
    switch (status) {
      case CancellationStatus.Pending:
        return 'Pending';
      case CancellationStatus.Approved:
        return 'Approved';
      case CancellationStatus.Rejected:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }
}
