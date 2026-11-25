
import { PagedResult } from '../../shared/models/paged-result.model';

// Enrollment Models

export interface EnrollmentResponse {
  enrollmentId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  courseId: number;
  courseName: string;
  enrolledAt: string;
  status: number;
}

export interface CreateEnrollmentRequest {
  courseId: number;
}

export interface EnrollmentFilter {
  search?: string;
  courseId?: number | null;
  status?: number | null;
  fromDate?: string;
  toDate?: string;
}

export type EnrollmentPagedResult = PagedResult<EnrollmentResponse>;

// Cancellation Models

export enum CancellationStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export interface CancellationResponse {
  cancellationRequestId: number;
  enrollmentId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  courseName: string;
  reason: string;
  status: CancellationStatus;
  requestedAt: string;
  reviewedAt: string | null;
  adminRemarks: string | null;
}

export interface CreateCancellationRequest {
  reason: string;
}

export interface ReviewCancellationRequest {
  adminRemarks?: string | null;
}

export interface CancellationFilter {
  search?: string;
  courseId?: number | null;
  status?: CancellationStatus | null;
  fromDate?: string;
  toDate?: string;
}

export type CancellationPagedResult =
  PagedResult<CancellationResponse>;
