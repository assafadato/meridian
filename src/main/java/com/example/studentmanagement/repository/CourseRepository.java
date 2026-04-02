package com.example.studentmanagement.repository;

import com.example.studentmanagement.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    boolean existsByName(String name);
    List<Course> findByNameContainingIgnoreCase(String name);
    List<Course> findByTeacher(String teacher);
}
