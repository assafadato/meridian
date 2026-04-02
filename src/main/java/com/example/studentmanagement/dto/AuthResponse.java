package com.example.studentmanagement.dto;

import com.example.studentmanagement.model.User;

public record AuthResponse(String token, String username, User.Role role) {}
