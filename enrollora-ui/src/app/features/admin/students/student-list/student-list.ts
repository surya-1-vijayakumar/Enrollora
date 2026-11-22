import { Component,inject,OnInit,signal,ChangeDetectionStrategy,} from '@angular/core';

import { DatePipe, DecimalPipe } from '@angular/common';
import { StudentService } from '../student.service';
import {
  StudentResponse,
  StudentFilter,
  UpdateStudentRequest,
} from '../student.models';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, ReactiveFormsModule],
  templateUrl: './student-list.html',
  styleUrl: './student-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentList implements OnInit {
  private studentService = inject(StudentService);

  // Student list state
  students = signal<StudentResponse[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');

  // Pagination state
  pageNumber = signal(1);
  pageSize = signal(5);
  totalRecords = signal(0);
  totalPages = signal(0);

  // Student details state
  selectedStudent = signal<StudentResponse | null>(null);
  isDetailsLoading = signal(false);
  detailsError = signal('');

  // Filters remain a normal object for ngModel binding
  filters: StudentFilter = {
    search: '',
    status: null,
    department: '',
    minAge: null,
    maxAge: null,
    minCgpa: null,
    maxCgpa: null,
  };

  // Edit modal state
  isEditModalOpen = signal(false);
  editingStudentId = signal<number | null>(null);

  // Reactive form remains a FormGroup
  studentForm = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    department: new FormControl('', Validators.required),
    age: new FormControl(18, [
      Validators.required,
      Validators.min(17),
      Validators.max(60),
    ]),
    cgpa: new FormControl(0, [
      Validators.required,
      Validators.min(0),
      Validators.max(10),
    ]),
  });

  ngOnInit(): void {
    this.loadStudents();
  }

  // Load students from the API
  loadStudents(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.studentService
      .getStudents(this.pageNumber(), this.pageSize(), this.filters)
      .subscribe({
        next: (response) => {
          this.students.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.pageNumber.set(response.pageNumber);
          this.pageSize.set(response.pageSize);
          this.isLoading.set(false);
        },

        error: (error) => {
          console.error('Failed to load students:', error);
          this.errorMessage.set('Unable to load students.');
          this.isLoading.set(false);
        },
      });
  }

  approveStudent(id: number): void {
    if (!confirm('Are you sure you want to approve this student?')) {
      return;
    }

    this.studentService.approveStudent(id).subscribe({
      next: (response) => {
        alert(response.message);
        this.loadStudents();
      },
      error: (error) => {
        console.error(error);
        alert('Unable to approve student.');
      },
    });
  }

  rejectStudent(id: number): void {
    if (!confirm('Are you sure you want to reject this student?')) {
      return;
    }

    this.studentService.rejectStudent(id).subscribe({
      next: (response) => {
        alert(response.message);
        this.loadStudents();
      },
      error: (error) => {
        console.error(error);
        alert('Unable to reject student.');
      },
    });
  }

  // Pagination
  goToPreviousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadStudents();
    }
  }

  goToNextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadStudents();
    }
  }

  changePageSize(size: string): void {
    this.pageSize.set(Number(size));
    this.pageNumber.set(1);
    this.loadStudents();
  }

  // Apply filters
  applyFilters(): void {
    this.pageNumber.set(1);
    this.loadStudents();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      status: null,
      department: '',
      minAge: null,
      maxAge: null,
      minCgpa: null,
      maxCgpa: null,
    };

    this.pageNumber.set(1);
    this.loadStudents();
  }

  // View student details
  viewStudent(id: number): void {
    this.selectedStudent.set(null);
    this.isDetailsLoading.set(true);
    this.detailsError.set('');

    this.studentService.getStudentById(id).subscribe({
      next: (student) => {
        this.selectedStudent.set(student);
        this.isDetailsLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load student details:', error);
        this.detailsError.set('Unable to load student details.');
        this.isDetailsLoading.set(false);
      },
    });
  }

  closeStudentDetails(): void {
    this.selectedStudent.set(null);
    this.detailsError.set('');
  }

  // Edit student
  editStudent(id: number): void {
    this.editingStudentId.set(id);
    this.isEditModalOpen.set(true);

    this.studentService.getStudentById(id).subscribe({
      next: (student) => {
        this.studentForm.patchValue({
          name: student.name,
          email: student.email,
          department: student.department,
          age: student.age,
          cgpa: student.cgpa,
        });
      },
      error: (error) => {
        console.error('Failed to load student details', error);
      },
    });
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.editingStudentId.set(null);

    this.studentForm.reset({
      name: '',
      email: '',
      department: '',
      age: 18,
      cgpa: 0,
    });
  }

  updateStudent(): void {
    const studentId = this.editingStudentId();

    if (this.studentForm.invalid || studentId === null) {
      return;
    }

    const formValue = this.studentForm.getRawValue();

    const studentData: UpdateStudentRequest = {
      name: formValue.name!,
      email: formValue.email!,
      department: formValue.department!,
      age: formValue.age!,
      cgpa: formValue.cgpa!,
    };

    this.studentService.updateStudent(studentId, studentData).subscribe({
      next: (updatedStudent) => {
        console.log('Student updated:', updatedStudent);
        this.closeEditModal();
        this.loadStudents();
      },
      error: (error) => {
        console.error('Failed to update student:', error);
      },
    });
  }

  // Delete student
  deleteStudent(id: number): void {
    if (!confirm('Are you sure you want to delete this student?')) {
      return;
    }

    this.studentService.deleteStudent(id).subscribe({
      next: () => {
        this.loadStudents();
      },
      error: (error) => {
        console.error('Failed to delete student:', error);
      },
    });
  }
}