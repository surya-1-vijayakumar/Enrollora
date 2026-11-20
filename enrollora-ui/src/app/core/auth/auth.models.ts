export interface RegisterStudentRequest {
  name: string;
  email: string;
  password: string;
  department: string;
  age: number;
  cgpa: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}
export type UserRole = 'Administrator' | 'Student';
export interface LoginResponse {
  token: string;
  role: UserRole;
  name: string;
  email: string;
  expiresAt: string;
}

export interface ApiMessage {
  message: string;
}
