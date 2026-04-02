package com.example.studentmanagement.service;

import com.example.studentmanagement.dto.CreateStudentRequest;
import com.example.studentmanagement.model.Student;
import com.example.studentmanagement.model.User;
import com.example.studentmanagement.repository.StudentRepository;
import com.example.studentmanagement.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class StudentService {

    @Autowired private StudentRepository studentRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Student getStudentById(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Student not found with id: " + id));
    }

    public List<Student> searchByName(String name) {
        return studentRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(name, name);
    }

    public List<Student> findByFirstName(String firstName) {
        return studentRepository.findByFirstName(firstName);
    }

    public List<Student> findByLastName(String lastName) {
        return studentRepository.findByLastName(lastName);
    }

    public List<Student> findByDateOfBirth(LocalDate dateOfBirth) {
        return studentRepository.findByDateOfBirth(dateOfBirth);
    }

    public List<Student> findByFullName(String firstName, String lastName) {
        return studentRepository.findByFirstNameAndLastName(firstName, lastName);
    }

    public List<Student> findByCourse(String courseName) {
        return studentRepository.findByCourse(courseName);
    }

    @Transactional
    public Student createStudent(Student student) {
        if (studentRepository.existsByEmail(student.getEmail())) {
            throw new IllegalArgumentException("Student with email " + student.getEmail() + " already exists");
        }
        return studentRepository.save(student);
    }

    @Transactional
    public Student createStudentWithAccount(CreateStudentRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + req.getUsername());
        }
        if (studentRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + req.getEmail());
        }
        User user = userRepository.save(User.builder()
                .username(req.getUsername())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(User.Role.STUDENT)
                .build());
        Student student = new Student();
        student.setFirstName(req.getFirstName());
        student.setLastName(req.getLastName());
        student.setEmail(req.getEmail());
        student.setDateOfBirth(req.getDateOfBirth());
        student.setLinkedUser(user);
        return studentRepository.save(student);
    }

    public Optional<Student> findByUsername(String username) {
        return studentRepository.findByLinkedUserUsername(username);
    }

    @Transactional
    public Student updateStudent(Long id, Student studentDetails) {
        Student student = getStudentById(id);
        student.setFirstName(studentDetails.getFirstName());
        student.setLastName(studentDetails.getLastName());
        student.setEmail(studentDetails.getEmail());
        student.setDateOfBirth(studentDetails.getDateOfBirth());
        return studentRepository.save(student);
    }

    public void deleteStudent(Long id) {
        if (!studentRepository.existsById(id)) {
            throw new EntityNotFoundException("Student not found with id: " + id);
        }
        studentRepository.deleteById(id);
    }
}
