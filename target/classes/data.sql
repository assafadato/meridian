-- Sample users
INSERT INTO users (username, password, role) VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN');
INSERT INTO users (username, password, role) VALUES ('teacher1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'TEACHER');
INSERT INTO users (username, password, role) VALUES ('student1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'STUDENT');

-- Sample students
INSERT INTO students (first_name, last_name, email, date_of_birth)
VALUES ('John', 'Doe', 'john.doe@school.com', '2005-01-15');

INSERT INTO students (first_name, last_name, email, date_of_birth)
VALUES ('Jane', 'Smith', 'jane.smith@school.com', '2006-03-22');

INSERT INTO students (first_name, last_name, email, date_of_birth)
VALUES ('Michael', 'Johnson', 'michael.johnson@school.com', '2005-07-10');

INSERT INTO students (first_name, last_name, email, date_of_birth)
VALUES ('Emily', 'Davis', 'emily.davis@school.com', '2006-11-05');

-- Sample courses
INSERT INTO courses (name, description, teacher, credits)
VALUES ('Mathematics', 'Comprehensive mathematics covering algebra and geometry', 'Dr. Williams', 4);

INSERT INTO courses (name, description, teacher, credits)
VALUES ('Physics', 'Fundamentals of classical and modern physics', 'Dr. Brown', 4);

INSERT INTO courses (name, description, teacher, credits)
VALUES ('English Literature', 'Study of classic literature and writing skills', 'Ms. Taylor', 3);

INSERT INTO courses (name, description, teacher, credits)
VALUES ('History', 'World history and social studies', 'Mr. Wilson', 3);

-- Enrollments
INSERT INTO enrollments (student_id, course_id)
SELECT s.id, c.id FROM students s, courses c
WHERE s.email = 'john.doe@school.com' AND c.name = 'Mathematics';

INSERT INTO enrollments (student_id, course_id)
SELECT s.id, c.id FROM students s, courses c
WHERE s.email = 'john.doe@school.com' AND c.name = 'Physics';

INSERT INTO enrollments (student_id, course_id)
SELECT s.id, c.id FROM students s, courses c
WHERE s.email = 'jane.smith@school.com' AND c.name = 'English Literature';

INSERT INTO enrollments (student_id, course_id)
SELECT s.id, c.id FROM students s, courses c
WHERE s.email = 'jane.smith@school.com' AND c.name = 'Mathematics';

INSERT INTO enrollments (student_id, course_id)
SELECT s.id, c.id FROM students s, courses c
WHERE s.email = 'michael.johnson@school.com' AND c.name = 'History';

INSERT INTO enrollments (student_id, course_id)
SELECT s.id, c.id FROM students s, courses c
WHERE s.email = 'emily.davis@school.com' AND c.name = 'Physics';

-- Sample grades
INSERT INTO grades (enrollment_id, score, grade_type)
SELECT e.id, 88.5, 'MIDTERM' FROM enrollments e
JOIN students s ON e.student_id = s.id
JOIN courses c ON e.course_id = c.id
WHERE s.email = 'john.doe@school.com' AND c.name = 'Mathematics';

INSERT INTO grades (enrollment_id, score, grade_type)
SELECT e.id, 92.0, 'ASSIGNMENT' FROM enrollments e
JOIN students s ON e.student_id = s.id
JOIN courses c ON e.course_id = c.id
WHERE s.email = 'john.doe@school.com' AND c.name = 'Physics';

INSERT INTO grades (enrollment_id, score, grade_type)
SELECT e.id, 78.0, 'MIDTERM' FROM enrollments e
JOIN students s ON e.student_id = s.id
JOIN courses c ON e.course_id = c.id
WHERE s.email = 'jane.smith@school.com' AND c.name = 'English Literature';

INSERT INTO grades (enrollment_id, score, grade_type)
SELECT e.id, 85.0, 'FINAL' FROM enrollments e
JOIN students s ON e.student_id = s.id
JOIN courses c ON e.course_id = c.id
WHERE s.email = 'michael.johnson@school.com' AND c.name = 'History';

-- Sample attendance
INSERT INTO attendance (enrollment_id, date, status)
SELECT e.id, '2026-03-01', 'PRESENT' FROM enrollments e
JOIN students s ON e.student_id = s.id
JOIN courses c ON e.course_id = c.id
WHERE s.email = 'john.doe@school.com' AND c.name = 'Mathematics';

INSERT INTO attendance (enrollment_id, date, status)
SELECT e.id, '2026-03-02', 'PRESENT' FROM enrollments e
JOIN students s ON e.student_id = s.id
JOIN courses c ON e.course_id = c.id
WHERE s.email = 'john.doe@school.com' AND c.name = 'Mathematics';

INSERT INTO attendance (enrollment_id, date, status)
SELECT e.id, '2026-03-03', 'ABSENT' FROM enrollments e
JOIN students s ON e.student_id = s.id
JOIN courses c ON e.course_id = c.id
WHERE s.email = 'john.doe@school.com' AND c.name = 'Mathematics';

INSERT INTO attendance (enrollment_id, date, status)
SELECT e.id, '2026-03-01', 'PRESENT' FROM enrollments e
JOIN students s ON e.student_id = s.id
JOIN courses c ON e.course_id = c.id
WHERE s.email = 'jane.smith@school.com' AND c.name = 'English Literature';

INSERT INTO attendance (enrollment_id, date, status)
SELECT e.id, '2026-03-02', 'LATE' FROM enrollments e
JOIN students s ON e.student_id = s.id
JOIN courses c ON e.course_id = c.id
WHERE s.email = 'jane.smith@school.com' AND c.name = 'English Literature';
