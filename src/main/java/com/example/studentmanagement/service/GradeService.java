package com.example.studentmanagement.service;

import com.example.studentmanagement.model.Enrollment;
import com.example.studentmanagement.model.Grade;
import com.example.studentmanagement.repository.EnrollmentRepository;
import com.example.studentmanagement.repository.GradeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GradeService {

    private final GradeRepository gradeRepository;
    private final EnrollmentRepository enrollmentRepository;

    public List<Grade> getAllGrades() {
        return gradeRepository.findAll();
    }

    public Grade getGradeById(Long id) {
        return gradeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Grade not found with id: " + id));
    }

    public List<Grade> getGradesByEnrollment(Long enrollmentId) {
        return gradeRepository.findByEnrollmentId(enrollmentId);
    }

    public List<Grade> getGradesByStudent(Long studentId) {
        return gradeRepository.findByEnrollmentStudentId(studentId);
    }

    public List<Grade> getGradesByCourse(Long courseId) {
        return gradeRepository.findByEnrollmentCourseId(courseId);
    }

    @Transactional
    public Grade createGrade(Grade grade) {
        if (grade.getEnrollment() != null && grade.getEnrollment().getId() != null) {
            Enrollment enrollment = enrollmentRepository
                    .findById(grade.getEnrollment().getId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Enrollment not found with id: " + grade.getEnrollment().getId()));
            grade.setEnrollment(enrollment);
        }
        return gradeRepository.save(grade);
    }

    @Transactional
    public Grade updateGrade(Long id, Grade gradeDetails) {
        Grade grade = getGradeById(id);
        grade.setScore(gradeDetails.getScore());
        grade.setGradeType(gradeDetails.getGradeType());
        grade.setGradedAt(gradeDetails.getGradedAt());
        return gradeRepository.save(grade);
    }

    public void deleteGrade(Long id) {
        if (!gradeRepository.existsById(id)) {
            throw new EntityNotFoundException("Grade not found with id: " + id);
        }
        gradeRepository.deleteById(id);
    }
}
