package com.example.studentmanagement.controller;

import com.example.studentmanagement.model.Attendance;
import com.example.studentmanagement.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "http://localhost:3000")
@Tag(name = "Attendance Management", description = "APIs for managing student attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @Operation(summary = "Get all attendance records")
    @GetMapping
    public List<Attendance> getAllAttendance() {
        return attendanceService.getAllAttendance();
    }

    @Operation(summary = "Get attendance record by ID")
    @GetMapping("/{id}")
    public ResponseEntity<Attendance> getAttendanceById(
            @Parameter(description = "Attendance ID") @PathVariable Long id) {
        return ResponseEntity.ok(attendanceService.getAttendanceById(id));
    }

    @Operation(summary = "Get attendance by enrollment")
    @GetMapping("/enrollment/{enrollmentId}")
    public List<Attendance> getAttendanceByEnrollment(
            @Parameter(description = "Enrollment (StudentCourse) ID") @PathVariable Long enrollmentId) {
        return attendanceService.getAttendanceByEnrollment(enrollmentId);
    }

    @Operation(summary = "Get attendance by student")
    @GetMapping("/student/{studentId}")
    public List<Attendance> getAttendanceByStudent(
            @Parameter(description = "Student ID") @PathVariable Long studentId) {
        return attendanceService.getAttendanceByStudent(studentId);
    }

    @Operation(summary = "Get attendance by course")
    @GetMapping("/course/{courseId}")
    public List<Attendance> getAttendanceByCourse(
            @Parameter(description = "Course ID") @PathVariable Long courseId) {
        return attendanceService.getAttendanceByCourse(courseId);
    }

    @Operation(summary = "Get attendance by date")
    @GetMapping("/date")
    public List<Attendance> getAttendanceByDate(
            @Parameter(description = "Date (yyyy-MM-dd)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return attendanceService.getAttendanceByDate(date);
    }

    @Operation(summary = "Create an attendance record")
    @PostMapping
    public ResponseEntity<Attendance> createAttendance(@Valid @RequestBody Attendance attendance) {
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceService.createAttendance(attendance));
    }

    @Operation(summary = "Update an attendance record")
    @PutMapping("/{id}")
    public ResponseEntity<Attendance> updateAttendance(
            @Parameter(description = "Attendance ID") @PathVariable Long id,
            @Valid @RequestBody Attendance attendance) {
        return ResponseEntity.ok(attendanceService.updateAttendance(id, attendance));
    }

    @Operation(summary = "Delete an attendance record")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttendance(
            @Parameter(description = "Attendance ID") @PathVariable Long id) {
        attendanceService.deleteAttendance(id);
        return ResponseEntity.noContent().build();
    }
}
