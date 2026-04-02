package com.example.studentmanagement.controller;

import com.example.studentmanagement.model.User;
import com.example.studentmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/me")
    public ResponseEntity<User> getMyProfile(Authentication auth) {
        return userRepository.findByUsername(auth.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(@RequestBody Map<String, Object> body, Authentication auth) {
        return userRepository.findByUsername(auth.getName()).map(user -> {
            Object usernameObj = body.get("username");
            Object passwordObj = body.get("password");
            Object photoObj    = body.get("profilePhoto");

            if (usernameObj != null) {
                String newUsername = usernameObj.toString().strip();
                if (!newUsername.isEmpty() && !newUsername.equals(user.getUsername())) {
                    if (userRepository.existsByUsername(newUsername)) {
                        return ResponseEntity.status(HttpStatus.CONFLICT).body("Username already taken");
                    }
                    user.setUsername(newUsername);
                }
            }
            if (passwordObj != null) {
                String newPassword = passwordObj.toString();
                if (!newPassword.isBlank()) {
                    user.setPassword(passwordEncoder.encode(newPassword));
                }
            }
            if (body.containsKey("profilePhoto")) {
                user.setProfilePhoto(photoObj == null || photoObj.toString().isBlank() ? null : photoObj.toString());
            }
            return ResponseEntity.ok((Object) userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> adminUpdateUser(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return userRepository.findById(id).map(user -> {
            Object usernameObj = body.get("username");
            Object passwordObj = body.get("password");
            if (usernameObj != null) {
                String newUsername = usernameObj.toString().strip();
                if (!newUsername.isEmpty() && !newUsername.equals(user.getUsername())) {
                    if (userRepository.existsByUsername(newUsername)) {
                        return ResponseEntity.status(HttpStatus.CONFLICT).body("Username already taken");
                    }
                    user.setUsername(newUsername);
                }
            }
            if (passwordObj != null && !passwordObj.toString().isBlank()) {
                user.setPassword(passwordEncoder.encode(passwordObj.toString()));
            }
            return ResponseEntity.ok((Object) userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/teachers")
    public List<User> getTeachers() {
        // All authenticated roles may list teachers (students need this for messaging)
        return userRepository.findByRole(User.Role.TEACHER);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return ResponseEntity.status(HttpStatus.CREATED).body(userRepository.save(user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
