package com.example.studentmanagement.service;

import com.example.studentmanagement.repository.AttendanceRepository;
import com.example.studentmanagement.repository.CourseRepository;
import com.example.studentmanagement.repository.EnrollmentRepository;
import com.example.studentmanagement.repository.GradeRepository;
import com.example.studentmanagement.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class DashboardService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private GradeRepository gradeRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalStudents", studentRepository.count());
        stats.put("totalCourses", courseRepository.count());
        stats.put("totalEnrollments", enrollmentRepository.count());

        Double avgGrade = gradeRepository.findAverageScore();
        stats.put("averageGrade", avgGrade != null ? Math.round(avgGrade * 10.0) / 10.0 : 0.0);

        long totalAttendance = attendanceRepository.countAll();
        long presentCount = attendanceRepository.countPresent();
        double attendanceRate = totalAttendance > 0
                ? Math.round((presentCount * 100.0 / totalAttendance) * 10.0) / 10.0
                : 0.0;
        stats.put("attendanceRate", attendanceRate);

        return stats;
    }
}
