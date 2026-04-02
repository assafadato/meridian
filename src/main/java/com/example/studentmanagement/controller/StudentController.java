package com.example.studentmanagement.controller;

import com.example.studentmanagement.model.Student;
import com.example.studentmanagement.service.StudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
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
@RequestMapping("/api/students")
@CrossOrigin(origins = "http://localhost:3000")
@Tag(name = "Student Management", description = "APIs for managing students")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @Operation(summary = "Get all students")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved all students",
            content = @Content(schema = @Schema(implementation = Student.class)))
    @GetMapping
    public List<Student> getAllStudents() {
        return studentService.getAllStudents();
    }

    @Operation(summary = "Get student by ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Successfully retrieved student",
                content = @Content(schema = @Schema(implementation = Student.class))),
        @ApiResponse(responseCode = "404", description = "Student not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(
            @Parameter(description = "ID of the student", required = true)
            @PathVariable Long id) {
        try {
            return ResponseEntity.ok(studentService.getStudentById(id));
        } catch (jakarta.persistence.EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Create new student")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Student successfully created",
                content = @Content(schema = @Schema(implementation = Student.class))),
        @ApiResponse(responseCode = "400", description = "Invalid input or email already exists")
    })
    @PostMapping
    public ResponseEntity<Student> createStudent(
            @Parameter(description = "Student details", required = true)
            @Valid @RequestBody Student student) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(studentService.createStudent(student));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @Operation(summary = "Update student")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Student successfully updated",
                content = @Content(schema = @Schema(implementation = Student.class))),
        @ApiResponse(responseCode = "404", description = "Student not found")
    })
    @PutMapping("/{id}")
    public ResponseEntity<Student> updateStudent(
            @Parameter(description = "ID of the student", required = true)
            @PathVariable Long id,
            @Parameter(description = "Updated student details", required = true)
            @Valid @RequestBody Student studentDetails) {
        try {
            return ResponseEntity.ok(studentService.updateStudent(id, studentDetails));
        } catch (jakarta.persistence.EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Delete student")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Student successfully deleted"),
        @ApiResponse(responseCode = "404", description = "Student not found")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(
            @Parameter(description = "ID of the student", required = true)
            @PathVariable Long id) {
        try {
            studentService.deleteStudent(id);
            return ResponseEntity.noContent().build();
        } catch (jakarta.persistence.EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Search students by name")
    @GetMapping("/search")
    public List<Student> searchStudents(
            @Parameter(description = "Name to search", required = true)
            @RequestParam String name) {
        return studentService.searchByName(name);
    }

    @Operation(summary = "Get students by course name")
    @GetMapping("/course/{courseName}")
    public List<Student> getStudentsByCourse(
            @Parameter(description = "Course name", required = true)
            @PathVariable String courseName) {
        return studentService.findByCourse(courseName);
    }

    @Operation(summary = "Find students by date of birth")
    @GetMapping("/search/dateOfBirth")
    public ResponseEntity<List<Student>> findByDateOfBirth(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateOfBirth) {
        return ResponseEntity.ok(studentService.findByDateOfBirth(dateOfBirth));
    }

    @Operation(summary = "Find students by full name")
    @GetMapping("/search/fullName")
    public ResponseEntity<List<Student>> findByFullName(
            @RequestParam String firstName,
            @RequestParam String lastName) {
        return ResponseEntity.ok(studentService.findByFullName(firstName, lastName));
    }
}
