DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(20)  NOT NULL DEFAULT 'STUDENT'
);

CREATE TABLE students (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    date_of_birth DATE         NOT NULL,
    enrolled_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE courses (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500) NOT NULL,
    teacher     VARCHAR(100),
    credits     INT
);

CREATE TABLE enrollments (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id  BIGINT    NOT NULL,
    course_id   BIGINT    NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id)  REFERENCES courses(id)  ON DELETE CASCADE,
    UNIQUE (student_id, course_id)
);

CREATE TABLE grades (
    id           BIGINT         AUTO_INCREMENT PRIMARY KEY,
    enrollment_id BIGINT        NOT NULL,
    score        DECIMAL(5, 2)  NOT NULL,
    grade_type   VARCHAR(20)    NOT NULL,
    graded_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE
);

CREATE TABLE attendance (
    id            BIGINT      AUTO_INCREMENT PRIMARY KEY,
    enrollment_id BIGINT      NOT NULL,
    date          DATE        NOT NULL,
    status        VARCHAR(10) NOT NULL,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    UNIQUE (enrollment_id, date)
);
