package com.example.studentmanagement.repository;

import com.example.studentmanagement.model.GradeInquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GradeInquiryRepository extends JpaRepository<GradeInquiry, Long> {
    List<GradeInquiry> findByStudentId(Long studentId);
    List<GradeInquiry> findByGradeEnrollmentCourseTeacher(String teacherUsername);
}
