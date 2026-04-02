package com.example.studentmanagement.repository;

import com.example.studentmanagement.model.Attendance;
import com.example.studentmanagement.model.Attendance.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findByEnrollmentId(Long enrollmentId);

    List<Attendance> findByEnrollmentStudentId(Long studentId);

    List<Attendance> findByEnrollmentCourseId(Long courseId);

    List<Attendance> findByDate(LocalDate date);

    List<Attendance> findByStatus(AttendanceStatus status);

    @Query("SELECT COUNT(a) FROM Attendance a")
    long countAll();

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.status = 'PRESENT'")
    long countPresent();
}
