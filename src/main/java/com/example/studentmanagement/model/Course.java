package com.example.studentmanagement.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Entity
@Data
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Course name is required")
    @Size(max = 100)
    @Column(unique = true)
    private String name;

    @NotBlank(message = "Description is required")
    @Size(max = 500)
    private String description;

    private String teacher;

    private Integer credits;
}
