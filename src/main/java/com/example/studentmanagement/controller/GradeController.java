package com.example.studentmanagement.controller;

import com.example.studentmanagement.model.Grade;
import com.example.studentmanagement.service.GradeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grades")
@CrossOrigin(origins = "http://localhost:3000")
@Tag(name = "Grade Management", description = "APIs for managing student grades")
public class GradeController {

    @Autowired
    private GradeService gradeService;

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

    @Operation(summary = "Create a new grade")
    @PostMapping
    public ResponseEntity<Grade> createGrade(@Valid @RequestBody Grade grade) {
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
