package com.example.studentmanagement.controller;

import com.example.studentmanagement.model.Enrollment;
import com.example.studentmanagement.service.EnrollmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
@CrossOrigin(origins = "http://localhost:3000")
@Tag(name = "Enrollment Management", description = "APIs for managing student course enrollments")
public class EnrollmentController {

    @Autowired
    private EnrollmentService enrollmentService;

    @Operation(summary = "Get all enrollments")
    @GetMapping
    public List<Enrollment> getAllEnrollments() {
        return enrollmentService.getAllEnrollments();
    }

    @Operation(summary = "Get enrollment by ID")
    @GetMapping("/{id}")
    public ResponseEntity<Enrollment> getEnrollmentById(
            @Parameter(description = "Enrollment ID") @PathVariable Long id) {
        try {
            return ResponseEntity.ok(enrollmentService.getEnrollmentById(id));
        } catch (jakarta.persistence.EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Get enrollments by student")
    @GetMapping("/student/{studentId}")
    public List<Enrollment> getEnrollmentsByStudent(
            @Parameter(description = "Student ID") @PathVariable Long studentId) {
        return enrollmentService.getEnrollmentsByStudent(studentId);
    }

    @Operation(summary = "Get enrollments by course")
    @GetMapping("/course/{courseId}")
    public List<Enrollment> getEnrollmentsByCourse(
            @Parameter(description = "Course ID") @PathVariable Long courseId) {
        return enrollmentService.getEnrollmentsByCourse(courseId);
    }

    @Operation(summary = "Enroll a student in a course")
    @PostMapping("/student/{studentId}/course/{courseId}")
    public ResponseEntity<Enrollment> enroll(
            @Parameter(description = "Student ID") @PathVariable Long studentId,
            @Parameter(description = "Course ID") @PathVariable Long courseId) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(enrollmentService.enroll(studentId, courseId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (jakarta.persistence.EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Unenroll a student from a course")
    @DeleteMapping("/student/{studentId}/course/{courseId}")
    public ResponseEntity<Void> unenroll(
            @Parameter(description = "Student ID") @PathVariable Long studentId,
            @Parameter(description = "Course ID") @PathVariable Long courseId) {
        try {
            enrollmentService.unenroll(studentId, courseId);
            return ResponseEntity.noContent().build();
        } catch (jakarta.persistence.EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Delete an enrollment by ID")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEnrollment(
            @Parameter(description = "Enrollment ID") @PathVariable Long id) {
        try {
            enrollmentService.deleteEnrollment(id);
            return ResponseEntity.noContent().build();
        } catch (jakarta.persistence.EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
