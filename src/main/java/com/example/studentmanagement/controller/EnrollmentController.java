package com.example.studentmanagement.controller;

import com.example.studentmanagement.model.Enrollment;
import com.example.studentmanagement.service.EnrollmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.example.studentmanagement.repository.CourseRepository;
import com.example.studentmanagement.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
@CrossOrigin(origins = "http://localhost:3000")
@Tag(name = "Enrollment Management", description = "APIs for managing student course enrollments")
public class EnrollmentController {

    @Autowired private EnrollmentService enrollmentService;
    @Autowired private StudentService studentService;
    @Autowired private CourseRepository courseRepository;

    @Operation(summary = "Get all enrollments for my courses (teacher)")
    @GetMapping("/teacher")
    @PreAuthorize("hasRole('TEACHER')")
    public List<Enrollment> getTeacherEnrollments(Authentication auth) {
        return courseRepository.findByTeacher(auth.getName()).stream()
                .flatMap(c -> enrollmentService.getEnrollmentsByCourse(c.getId()).stream())
                .toList();
    }

    @Operation(summary = "Count new enrollments for teacher since a given timestamp")
    @GetMapping("/teacher/new-count")
    @PreAuthorize("hasRole('TEACHER')")
    public java.util.Map<String, Long> teacherNewEnrollments(
            @RequestParam(required = false) String since, Authentication auth) {
        List<Enrollment> all = courseRepository.findByTeacher(auth.getName()).stream()
                .flatMap(c -> enrollmentService.getEnrollmentsByCourse(c.getId()).stream())
                .toList();
        long count;
        if (since != null && !since.isBlank()) {
            java.time.LocalDateTime sinceTs = java.time.LocalDateTime.parse(since,
                    java.time.format.DateTimeFormatter.ISO_DATE_TIME);
            count = all.stream().filter(e -> e.getEnrolledAt() != null && e.getEnrolledAt().isAfter(sinceTs)).count();
        } else {
            count = all.size();
        }
        return java.util.Map.of("count", count);
    }

    @Operation(summary = "Get my enrollments (student)")
    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<Enrollment>> getMyEnrollments(Authentication auth) {
        return studentService.findByUsername(auth.getName())
                .map(s -> ResponseEntity.ok(enrollmentService.getEnrollmentsByStudent(s.getId())))
                .orElse(ResponseEntity.ok(List.of()));
    }

    @Operation(summary = "Enroll myself in a course (student)")
    @PostMapping("/me/course/{courseId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Enrollment> enrollMyself(@PathVariable Long courseId, Authentication auth) {
        return studentService.findByUsername(auth.getName())
                .map(s -> {
                    try {
                        Enrollment created = enrollmentService.enroll(s.getId(), courseId);
                        return ResponseEntity.status(HttpStatus.CREATED).body(created);
                    } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.CONFLICT).<Enrollment>build();
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

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
