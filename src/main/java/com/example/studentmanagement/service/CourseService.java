package com.example.studentmanagement.service;

import com.example.studentmanagement.model.Course;
import com.example.studentmanagement.model.Enrollment;
import com.example.studentmanagement.repository.CourseRepository;
import com.example.studentmanagement.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public Optional<Course> getCourseById(Long id) {
        return courseRepository.findById(id);
    }

    public Course createCourse(Course course) {
        return courseRepository.save(course);
    }

    public Optional<Course> updateCourse(Long id, Course courseDetails) {
        return courseRepository.findById(id)
                .map(course -> {
                    course.setName(courseDetails.getName());
                    course.setDescription(courseDetails.getDescription());
                    course.setTeacher(courseDetails.getTeacher());
                    course.setCredits(courseDetails.getCredits());
                    return courseRepository.save(course);
                });
    }

    public boolean deleteCourse(Long id) {
        return courseRepository.findById(id)
                .map(course -> { courseRepository.delete(course); return true; })
                .orElse(false);
    }

    public Map<String, Object> getCourseStatistics() {
        List<Course> allCourses    = courseRepository.findAll();
        List<Enrollment> allEnrollments = enrollmentRepository.findAll();

        int totalCourses         = allCourses.size();
        int totalStudentsEnrolled = allEnrollments.size();

        Map<Integer, Long> coursesByCredits = allCourses.stream()
                .filter(c -> c.getCredits() != null)
                .collect(Collectors.groupingBy(Course::getCredits, Collectors.counting()));

        double averageCredits = allCourses.stream()
                .filter(c -> c.getCredits() != null)
                .mapToInt(Course::getCredits)
                .average()
                .orElse(0.0);

        // Top-5 most enrolled courses
        List<Map<String, Object>> popularCourses = allEnrollments.stream()
                .collect(Collectors.groupingBy(Enrollment::getCourse, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<Course, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> Map.<String, Object>of(
                        "name", e.getKey().getName(),
                        "enrollmentCount", e.getValue()))
                .toList();

        return Map.of(
                "totalCourses",          totalCourses,
                "coursesByCredits",      coursesByCredits,
                "averageCredits",        averageCredits,
                "totalStudentsEnrolled", totalStudentsEnrolled,
                "popularCourses",        popularCourses
        );
    }
}
