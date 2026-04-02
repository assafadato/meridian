package com.example.studentmanagement.repository;

import com.example.studentmanagement.model.Grade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GradeRepository extends JpaRepository<Grade, Long> {

    List<Grade> findByEnrollmentId(Long enrollmentId);

    List<Grade> findByEnrollmentStudentId(Long studentId);

    List<Grade> findByEnrollmentCourseId(Long courseId);

    @Query("SELECT AVG(g.score) FROM Grade g")
    Double findAverageScore();

    @Query("SELECT AVG(g.score) FROM Grade g WHERE g.enrollment.student.id = :studentId")
    Double findAverageScoreByStudent(@Param("studentId") Long studentId);
}
