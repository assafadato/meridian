package com.example.studentmanagement.service;

import com.example.studentmanagement.model.Attendance;
import com.example.studentmanagement.model.Attendance.AttendanceStatus;
import com.example.studentmanagement.model.Enrollment;
import com.example.studentmanagement.repository.AttendanceRepository;
import com.example.studentmanagement.repository.EnrollmentRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }

    public Attendance getAttendanceById(Long id) {
        return attendanceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Attendance record not found with id: " + id));
    }

    public List<Attendance> getAttendanceByEnrollment(Long enrollmentId) {
        return attendanceRepository.findByEnrollmentId(enrollmentId);
    }

    public List<Attendance> getAttendanceByStudent(Long studentId) {
        return attendanceRepository.findByEnrollmentStudentId(studentId);
    }

    public List<Attendance> getAttendanceByCourse(Long courseId) {
        return attendanceRepository.findByEnrollmentCourseId(courseId);
    }

    public List<Attendance> getAttendanceByDate(LocalDate date) {
        return attendanceRepository.findByDate(date);
    }

    @Transactional
    public Optional<Attendance> createAttendanceForTeacher(Attendance attendance, String teacherUsername) {
        Optional<Enrollment> enrollmentOpt = enrollmentRepository.findById(attendance.getEnrollment().getId());
        if (enrollmentOpt.isEmpty()) return Optional.empty();
        Enrollment enrollment = enrollmentOpt.get();
        String courseTeacher = enrollment.getCourse() != null ? enrollment.getCourse().getTeacher() : null;
        if (!teacherUsername.equals(courseTeacher)) return Optional.empty();
        attendance.setEnrollment(enrollment);
        return Optional.of(attendanceRepository.save(attendance));
    }

    @Transactional
    public Attendance createAttendance(Attendance attendance) {
        if (attendance.getEnrollment() != null && attendance.getEnrollment().getId() != null) {
            Enrollment enrollment = enrollmentRepository.findById(attendance.getEnrollment().getId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Enrollment not found with id: " + attendance.getEnrollment().getId()));
            attendance.setEnrollment(enrollment);
        }
        return attendanceRepository.save(attendance);
    }

    @Transactional
    public Attendance updateAttendance(Long id, Attendance attendanceDetails) {
        Attendance attendance = getAttendanceById(id);
        attendance.setDate(attendanceDetails.getDate());
        attendance.setStatus(attendanceDetails.getStatus());
        return attendanceRepository.save(attendance);
    }

    public void deleteAttendance(Long id) {
        if (!attendanceRepository.existsById(id)) {
            throw new EntityNotFoundException("Attendance record not found with id: " + id);
        }
        attendanceRepository.deleteById(id);
    }
}
