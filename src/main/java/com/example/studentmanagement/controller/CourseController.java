package com.example.studentmanagement.controller;

import com.example.studentmanagement.model.Course;
import com.example.studentmanagement.repository.CourseRepository;
import com.example.studentmanagement.service.CourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "http://localhost:3000")
@Tag(name = "Course Management", description = "APIs for managing courses and student enrollments")
public class CourseController {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseService courseService;

    @Operation(summary = "Get all courses")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved all courses",
            content = @Content(schema = @Schema(implementation = Course.class)))
    @GetMapping
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    @Operation(summary = "Get course by ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Successfully retrieved course",
                content = @Content(schema = @Schema(implementation = Course.class))),
        @ApiResponse(responseCode = "404", description = "Course not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<Course> getCourseById(
            @Parameter(description = "ID of the course", required = true)
            @PathVariable Long id) {
        return courseRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Get courses assigned to the authenticated teacher")
    @GetMapping("/mine")
    @PreAuthorize("hasRole('TEACHER')")
    public List<Course> getMyCourses(Authentication auth) {
        return courseRepository.findByTeacher(auth.getName());
    }

    @Operation(summary = "Create new course")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Course successfully created",
                content = @Content(schema = @Schema(implementation = Course.class))),
        @ApiResponse(responseCode = "400", description = "Invalid input or course name already exists")
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Course> createCourse(
            @Parameter(description = "Course details", required = true)
            @Valid @RequestBody Course course) {
        if (courseRepository.existsByName(course.getName())) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(courseRepository.save(course));
    }

    @Operation(summary = "Update course")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Course successfully updated",
                content = @Content(schema = @Schema(implementation = Course.class))),
        @ApiResponse(responseCode = "404", description = "Course not found")
    })
    @PutMapping("/{id}")
    public ResponseEntity<Course> updateCourse(
            @Parameter(description = "ID of the course", required = true)
            @PathVariable Long id,
            @Parameter(description = "Updated course details", required = true)
            @Valid @RequestBody Course courseDetails) {
        return courseRepository.findById(id)
                .map(course -> {
                    course.setName(courseDetails.getName());
                    course.setDescription(courseDetails.getDescription());
                    course.setTeacher(courseDetails.getTeacher());
                    course.setCredits(courseDetails.getCredits());
                    return ResponseEntity.ok(courseRepository.save(course));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Delete course")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Course successfully deleted"),
        @ApiResponse(responseCode = "404", description = "Course not found")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(
            @Parameter(description = "ID of the course", required = true)
            @PathVariable Long id) {
        return courseRepository.findById(id)
                .map(course -> {
                    courseRepository.delete(course);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Search courses by name")
    @GetMapping("/search")
    public List<Course> searchCourses(
            @Parameter(description = "Course name to search", required = true)
            @RequestParam String name) {
        return courseRepository.findByNameContainingIgnoreCase(name);
    }

    @Operation(summary = "Get courses by teacher")
    @GetMapping("/teacher/{teacher}")
    public List<Course> getCoursesByTeacher(
            @Parameter(description = "Teacher name", required = true)
            @PathVariable String teacher) {
        return courseRepository.findByTeacher(teacher);
    }

    @Operation(summary = "Get course statistics")
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getCourseStatistics() {
        return ResponseEntity.ok(courseService.getCourseStatistics());
    }
}
