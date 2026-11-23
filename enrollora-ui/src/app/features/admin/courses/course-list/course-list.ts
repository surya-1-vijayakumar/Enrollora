
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CourseService } from '../course.service';
import { CourseResponse, SaveCourseRequest } from '../course.models';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-list.html',
  styleUrl: './course-list.css',
})
export class CourseListComponent implements OnInit {
  private courseService = inject(CourseService);

  courses = signal<CourseResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  showAddCourseModal = signal(false);
  isSaving = signal(false);
  formError = signal('');

  editingCourseId = signal<number | null>(null);

  // Deactivation state
  isDeactivating = signal(false);

  newCourse: SaveCourseRequest = this.getEmptyCourse();

  ngOnInit(): void {
    this.loadCourses();
  }

  private getEmptyCourse(): SaveCourseRequest {
    return {
      courseName: '',
      duration: '',
      fees: 0,
      capacity: 1,
      isActive: true,
    };
  }

  openAddCourseModal(): void {
    this.editingCourseId.set(null);
    this.newCourse = this.getEmptyCourse();
    this.formError.set('');
    this.showAddCourseModal.set(true);
  }

  openEditCourseModal(course: CourseResponse): void {
    this.editingCourseId.set(course.courseId);

    this.newCourse = {
      courseName: course.courseName,
      duration: course.duration,
      fees: course.fees,
      capacity: course.capacity,
      isActive: course.isActive,
    };

    this.formError.set('');
    this.showAddCourseModal.set(true);
  }

  closeAddCourseModal(): void {
    if (this.isSaving()) return;

    this.showAddCourseModal.set(false);
    this.formError.set('');
    this.editingCourseId.set(null);
  }

  saveCourse(): void {
    this.formError.set('');

    if (
      !this.newCourse.courseName.trim() ||
      !this.newCourse.duration.trim() ||
      this.newCourse.fees < 0 ||
      this.newCourse.capacity < 1
    ) {
      this.formError.set('Please enter valid course details.');
      return;
    }

    const request: SaveCourseRequest = {
      ...this.newCourse,
      courseName: this.newCourse.courseName.trim(),
      duration: this.newCourse.duration.trim(),
    };

    const courseId = this.editingCourseId();

    this.isSaving.set(true);

    const saveRequest = courseId === null
      ? this.courseService.createCourse(request)
      : this.courseService.updateCourse(courseId, request);

    saveRequest.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showAddCourseModal.set(false);
        this.editingCourseId.set(null);
        this.newCourse = this.getEmptyCourse();
        this.loadCourses();
      },
      error: (error) => {
        console.error('Error saving course:', error);

        this.isSaving.set(false);
        this.formError.set(
          error.error?.message ||
          error.error?.title ||
          'Unable to save course. Please try again.',
        );
      },
    });
  }

  // Deactivate a course
  deactivateCourse(course: CourseResponse): void {
    if (!course.isActive || this.isDeactivating()) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${course.courseName}"?`
    );

    if (!confirmed) {
      return;
    }

    this.isDeactivating.set(true);

    this.courseService.deactivateCourse(course.courseId).subscribe({
      next: () => {
        this.isDeactivating.set(false);
        this.loadCourses();
      },
      error: (error) => {
        console.error('Error deactivating course:', error);

        this.isDeactivating.set(false);
        this.errorMessage.set(
          error.error?.message ||
          error.error?.title ||
          'Unable to deactivate course. Please try again.'
        );
      },
    });
  }

  loadCourses(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.courseService
      .getCourses(this.pageNumber(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.courses.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading courses:', error);
          this.errorMessage.set('Unable to load courses.');
          this.isLoading.set(false);
        },
      });
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadCourses();
    }
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadCourses();
    }
  }
}
