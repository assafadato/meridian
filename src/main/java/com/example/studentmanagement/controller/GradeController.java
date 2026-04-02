package com.example.studentmanagement.controller;

import com.example.studentmanagement.model.Grade;
import com.example.studentmanagement.service.GradeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import com.example.studentmanagement.model.Enrollment;
import com.example.studentmanagement.repository.CourseRepository;
import com.example.studentmanagement.repository.EnrollmentRepository;
import com.example.studentmanagement.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grades")
@CrossOrigin(origins = "http://localhost:3000")
@Tag(name = "Grade Management", description = "APIs for managing student grades")
public class GradeController {

    @Autowired private GradeService gradeService;
    @Autowired private StudentService studentService;
    @Autowired private CourseRepository courseRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;

    @Operation(summary = "Count of new grades for student (since a given ISO datetime)")
    @GetMapping("/me/new-count")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<java.util.Map<String, Long>> getNewGradeCount(
            @RequestParam(required = false) String since, Authentication auth) {
        return studentService.findByUsername(auth.getName()).map(s -> {
            List<Grade> grades = gradeService.getGradesByStudent(s.getId());
            long count;
            if (since != null && !since.isBlank()) {
                java.time.LocalDateTime sinceTs = java.time.LocalDateTime.parse(since,
                        java.time.format.DateTimeFormatter.ISO_DATE_TIME);
                count = grades.stream().filter(g -> g.getGradedAt() != null && g.getGradedAt().isAfter(sinceTs)).count();
            } else {
                count = grades.size();
            }
            return ResponseEntity.ok(java.util.Map.of("count", count));
        }).orElse(ResponseEntity.ok(java.util.Map.of("count", 0L)));
    }

    @Operation(summary = "Get my grades (student)")
    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<Grade>> getMyGrades(Authentication auth) {
        return studentService.findByUsername(auth.getName())
                .map(s -> ResponseEntity.ok(gradeService.getGradesByStudent(s.getId())))
                .orElse(ResponseEntity.ok(List.of()));
    }

    @Operation(summary = "Get grades for my courses (teacher)")
    @GetMapping("/teacher")
    @PreAuthorize("hasRole('TEACHER')")
    public List<Grade> getTeacherGrades(Authentication auth) {
        return courseRepository.findByTeacher(auth.getName()).stream()
                .flatMap(c -> gradeService.getGradesByCourse(c.getId()).stream())
                .toList();
    }

    @Operation(summary = "Get all grades")
    @GetMapping
    public List<Grade> getAllGrades() {
        return gradeService.getAllGrades();
    }

    @Operation(summary = "Get grade by ID")
    @GetMapping("/{id}")
    public ResponseEntity<Grade> getGradeById(
            @Parameter(description = "Grade ID") @PathVariable Long id) {
        return ResponseEntity.ok(gradeService.getGradeById(id));
    }

    @Operation(summary = "Get grades by enrollment")
    @GetMapping("/enrollment/{enrollmentId}")
    public List<Grade> getGradesByEnrollment(
            @Parameter(description = "Enrollment ID") @PathVariable Long enrollmentId) {
        return gradeService.getGradesByEnrollment(enrollmentId);
    }

    @Operation(summary = "Get grades by student")
    @GetMapping("/student/{studentId}")
    public List<Grade> getGradesByStudent(
            @Parameter(description = "Student ID") @PathVariable Long studentId) {
        return gradeService.getGradesByStudent(studentId);
    }

    @Operation(summary = "Get grades by course")
    @GetMapping("/course/{courseId}")
    public List<Grade> getGradesByCourse(
            @Parameter(description = "Course ID") @PathVariable Long courseId) {
        return gradeService.getGradesByCourse(courseId);
    }

    @Operation(summary = "Create a new grade (admin only)")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Grade> createGrade(@Valid @RequestBody Grade grade) {
        return ResponseEntity.status(HttpStatus.CREATED).body(gradeService.createGrade(grade));
    }

    @Operation(summary = "Teacher adds a grade to one of their course enrollments")
    @PostMapping("/teacher")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> createGradeAsTeacher(@Valid @RequestBody Grade grade, Authentication auth) {
        Enrollment enrollment = enrollmentRepository.findById(grade.getEnrollment().getId())
                .orElse(null);
        if (enrollment == null) return ResponseEntity.notFound().build();
        String courseTeacher = enrollment.getCourse() != null ? enrollment.getCourse().getTeacher() : null;
        if (!auth.getName().equals(courseTeacher)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You are not the teacher of this course");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(gradeService.createGrade(grade));
    }

    @Operation(summary = "Update a grade")
    @PutMapping("/{id}")
    public ResponseEntity<Grade> updateGrade(
            @Parameter(description = "Grade ID") @PathVariable Long id,
            @Valid @RequestBody Grade grade) {
        return ResponseEntity.ok(gradeService.updateGrade(id, grade));
    }

    @Operation(summary = "Delete a grade")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGrade(
            @Parameter(description = "Grade ID") @PathVariable Long id) {
        gradeService.deleteGrade(id);
        return ResponseEntity.noContent().build();
    }
}
