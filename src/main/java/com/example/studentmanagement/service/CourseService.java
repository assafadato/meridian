package com.example.studentmanagement.service;

import com.example.studentmanagement.model.Course;
import com.example.studentmanagement.model.Enrollment;
import com.example.studentmanagement.repository.CourseRepository;
import com.example.studentmanagement.repository.EnrollmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

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
                .map(course -> {
                    courseRepository.delete(course);
                    return true;
                })
                .orElse(false);
    }

    public Map<String, Object> getCourseStatistics() {
        List<Course> allCourses = courseRepository.findAll();
        List<Enrollment> allEnrollments = enrollmentRepository.findAll();

        int totalCourses = allCourses.size();

        Map<Integer, Long> coursesByCredits = allCourses.stream()
                .filter(c -> c.getCredits() != null)
                .collect(Collectors.groupingBy(Course::getCredits, Collectors.counting()));

        double averageCredits = allCourses.stream()
                .filter(c -> c.getCredits() != null)
                .mapToInt(Course::getCredits)
                .average()
                .orElse(0.0);

        int totalStudentsEnrolled = allEnrollments.size();

        Map<Course, Long> coursesEnrollmentCount = allEnrollments.stream()
                .collect(Collectors.groupingBy(Enrollment::getCourse, Collectors.counting()));

        List<Map<String, Object>> popularCourses = coursesEnrollmentCount.entrySet().stream()
                .sorted(Map.Entry.<Course, Long>comparingByValue().reversed())
                .limit(5)
                .map(entry -> {
                    Map<String, Object> courseData = new HashMap<>();
                    courseData.put("name", entry.getKey().getName());
                    courseData.put("enrollmentCount", entry.getValue());
                    return courseData;
                })
                .collect(Collectors.toList());

        Map<String, Object> statistics = new HashMap<>();
        statistics.put("totalCourses", totalCourses);
        statistics.put("coursesByCredits", coursesByCredits);
        statistics.put("averageCredits", averageCredits);
        statistics.put("totalStudentsEnrolled", totalStudentsEnrolled);
        statistics.put("popularCourses", popularCourses);

        return statistics;
    }
}
