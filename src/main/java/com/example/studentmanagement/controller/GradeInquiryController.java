package com.example.studentmanagement.controller;

import com.example.studentmanagement.model.Grade;
import com.example.studentmanagement.model.GradeInquiry;
import com.example.studentmanagement.repository.GradeInquiryRepository;
import com.example.studentmanagement.repository.GradeRepository;
import com.example.studentmanagement.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/inquiries")
@RequiredArgsConstructor
public class GradeInquiryController {

    private final GradeInquiryRepository inquiryRepository;
    private final GradeRepository gradeRepository;
    private final StudentService studentService;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<GradeInquiry> submit(@RequestBody Map<String, Object> body, Authentication auth) {
        Long gradeId = Long.valueOf(body.get("gradeId").toString());
        String message = body.get("message").toString();

        return studentService.findByUsername(auth.getName()).map(student -> {
            Grade grade = gradeRepository.findById(gradeId)
                    .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Grade not found"));
            GradeInquiry inquiry = new GradeInquiry();
            inquiry.setGrade(grade);
            inquiry.setStudent(student);
            inquiry.setMessage(message);
            return ResponseEntity.status(HttpStatus.CREATED).body(inquiryRepository.save(inquiry));
        }).orElse(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<GradeInquiry>> myInquiries(Authentication auth) {
        return studentService.findByUsername(auth.getName())
                .map(s -> ResponseEntity.ok(inquiryRepository.findByStudentId(s.getId())))
                .orElse(ResponseEntity.ok(List.of()));
    }

    @GetMapping("/teacher")
    @PreAuthorize("hasRole('TEACHER')")
    public List<GradeInquiry> teacherInquiries(Authentication auth) {
        return inquiryRepository.findByGradeEnrollmentCourseTeacher(auth.getName());
    }

    @GetMapping("/teacher/new-count")
    @PreAuthorize("hasRole('TEACHER')")
    public Map<String, Long> teacherNewCount(@RequestParam(required = false) String since, Authentication auth) {
        List<GradeInquiry> all = inquiryRepository.findByGradeEnrollmentCourseTeacher(auth.getName());
        long count;
        if (since != null && !since.isBlank()) {
            java.time.LocalDateTime sinceTs = java.time.LocalDateTime.parse(since,
                    java.time.format.DateTimeFormatter.ISO_DATE_TIME);
            count = all.stream().filter(i -> i.getSubmittedAt() != null && i.getSubmittedAt().isAfter(sinceTs)).count();
        } else {
            count = all.stream().filter(i -> "PENDING".equals(i.getStatus())).count();
        }
        return Map.of("count", count);
    }

    @PutMapping("/{id}/respond")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<GradeInquiry> respond(@PathVariable Long id,
                                                 @RequestBody Map<String, String> body) {
        return inquiryRepository.findById(id).map(inq -> {
            inq.setTeacherResponse(body.get("response"));
            inq.setStatus("REVIEWED");
            return ResponseEntity.ok(inquiryRepository.save(inq));
        }).orElse(ResponseEntity.notFound().build());
    }
}
