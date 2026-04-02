export interface Student {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  enrolledAt?: string;
}

export interface Course {
  id?: number;
  name: string;
  description: string;
  teacher?: string;
  credits?: number;
}

export interface Enrollment {
  id?: number;
  student: Student;
  course: Course;
  enrolledAt?: string;
}

export interface Grade {
  id?: number;
  enrollment: { id: number };
  score: number;
  gradeType: string;
  gradedAt?: string;
}

export interface GradeDetail extends Omit<Grade, 'enrollment'> {
  enrollment: Enrollment;
}

export interface Attendance {
  id?: number;
  enrollment: { id: number };
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

export interface AttendanceDetail extends Omit<Attendance, 'enrollment'> {
  enrollment: Enrollment;
}

export interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  totalEnrollments: number;
  averageGrade: number;
  attendanceRate: number;
}

export interface User {
  username: string;
  role: string;
  token: string;
}
