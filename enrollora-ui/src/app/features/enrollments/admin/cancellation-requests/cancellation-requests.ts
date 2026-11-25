
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CancellationService } from '../../cancellation.service';
import {
  CancellationResponse,
  CancellationStatus,
} from '../../enrollment.models';

@Component({
  selector: 'app-admin-cancellation-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cancellation-requests.html',
  styleUrl: './cancellation-requests.css',
})
export class AdminCancellationRequestsComponent implements OnInit {
  private readonly cancellationService = inject(CancellationService);

  requests = signal<CancellationResponse[]>([]);
  isLoading = signal(false);
  isReviewing = signal(false);

  errorMessage = signal('');
  successMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  selectedRequest = signal<CancellationResponse | null>(null);
  reviewRemarks = '';

  readonly CancellationStatus = CancellationStatus;

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.cancellationService
      .getCancellationRequests(this.pageNumber(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.requests.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.detail ||
            error.error?.message ||
            error.error?.title ||
            'Unable to load cancellation requests.',
          );
          this.isLoading.set(false);
        },
      });
  }

  openReview(request: CancellationResponse): void {
    if (request.status !== CancellationStatus.Pending) {
      return;
    }

    this.selectedRequest.set(request);
    this.reviewRemarks = '';
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  closeReview(): void {
    if (this.isReviewing()) {
      return;
    }

    this.selectedRequest.set(null);
    this.reviewRemarks = '';
  }

  approveRequest(): void {
    this.reviewRequest(true);
  }

  rejectRequest(): void {
    this.reviewRequest(false);
  }

  private reviewRequest(approve: boolean): void {
    const request = this.selectedRequest();

    if (!request || this.isReviewing()) {
      return;
    }

    this.isReviewing.set(true);
    this.errorMessage.set('');

    const review = {
      adminRemarks: this.reviewRemarks.trim() || null,
    };

    const operation = approve
      ? this.cancellationService.approveCancellationRequest(
          request.cancellationRequestId,
          review,
        )
      : this.cancellationService.rejectCancellationRequest(
          request.cancellationRequestId,
          review,
        );

    operation.subscribe({
      next: () => {
        this.isReviewing.set(false);
        this.selectedRequest.set(null);
        this.reviewRemarks = '';

        this.successMessage.set(
          approve
            ? 'Cancellation request approved successfully.'
            : 'Cancellation request rejected successfully.',
        );

        this.loadRequests();
      },
      error: (error: HttpErrorResponse) => {
        this.isReviewing.set(false);
        this.errorMessage.set(
          error.error?.detail ||
          error.error?.message ||
          error.error?.title ||
          'Unable to review cancellation request.',
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

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadRequests();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadRequests();
    }
  }
}
