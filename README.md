# Meridian — Student Management Platform

> **Where Learning Reaches Its Peak**

Meridian is a full-stack student management platform built with **Spring Boot** and **React + TypeScript**. It provides fully role-isolated portals for administrators, teachers, and students, covering everything from course enrolment and grading to attendance tracking and real-time messaging.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Default Credentials](#default-credentials)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Role Reference](#role-reference)
- [Java 21 Modernisation](#java-21-modernisation)

---

## Features

### Admin Portal
- Unified **Users** management — create, edit, and delete students, teachers, and admins from one table
- Full **Courses** CRUD — create courses and assign teachers
- Manage **Grades** and **Attendance** across all entities
- Dashboard with live statistics

### Teacher Portal
- **Dashboard** — enrolled student count, recent grades, and attendance summary
- **Courses** — view all assigned courses and manage their details
- **Grades** — add grades for students in own courses only
- **Attendance** — record and review attendance per course
- **Students tab** — card grid sorted by name; each card shows unread message (red dot) and new inquiry (blue dot) indicators; click a card to open a split panel with the student's messages and grade inquiries
- **Inquiries tab** — respond to student grade inquiries with blue-dot notifications per item

### Student Portal
- **Dashboard** — enrolled courses, recent grades, and attendance summary
- **Courses** — browse all courses and self-enrol
- **Grades** — view personal grades with date; submit inquiries on specific grades; red-dot notification on new grades
- **Attendance** — view own attendance records per course
- **Teachers tab** — cards for each assigned teacher; send direct messages; red-dot notification for unread replies

### Cross-cutting
- **Profile page** — update username, password, and upload a profile photo (≤ 500 KB, stored as Base64)
- **Unified notifications** — per-item red/blue dot indicators on navbar tabs that dismiss on interaction, persisted in `localStorage`
- **JWT authentication** — stateless, role-aware, with a 24-hour expiry
- **Swagger UI** — interactive API explorer at `/swagger-ui.html`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | **Java 21** · Spring Boot 3.2 · Spring Security · Spring Data JPA |
| Concurrency | **Project Loom virtual threads** (`spring.threads.virtual.enabled=true`) |
| Database | MySQL 8 (Docker) · Hibernate DDL auto-update |
| Authentication | JWT (HS256) · BCrypt password hashing |
| Frontend | React 18 · TypeScript · Vite |
| UI Library | Material-UI (MUI) v6 |
| Forms | React Hook Form · Zod |
| HTTP client | Axios |
| API docs | SpringDoc OpenAPI / Swagger UI |
| Container | Docker Compose |

---

## Architecture

```
┌─────────────────────────────────┐      ┌──────────────────────────────┐
│  React + TypeScript (Vite)      │ HTTP │  Spring Boot REST API         │
│  localhost:3000                 │◄────►│  localhost:8080               │
│                                 │      │                               │
│  /src/pages/                    │      │  /controller  (REST)          │
│    admin/    — Dashboard, Users │      │  /service     (business logic)│
│    teacher/  — portal pages     │      │  /repository  (Spring Data)   │
│    student/  — portal pages     │      │  /model       (JPA entities)  │
│  /src/context/                  │      │  /security    (JWT filter)     │
│    AuthContext                  │      │  /config      (CORS, Security)│
│    NotificationContext          │      │                               │
└─────────────────────────────────┘      └──────────────┬───────────────┘
                                                        │ JDBC
                                         ┌──────────────▼───────────────┐
                                         │  MySQL 8  (Docker Compose)    │
                                         │  student_db  :3306            │
                                         └──────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- **Java 21+** (Amazon Corretto 21 or any OpenJDK 21 distribution)
- **Maven 3.8+**
- **Node.js 18+** and npm
- **Docker** and Docker Compose

> **Note — Java version:** Maven must run under Java 21. If your shell's `JAVA_HOME` points to an older JDK, set it before running Maven:
> ```bash
> export JAVA_HOME=/path/to/your/jdk-21
> ```
> On macOS with multiple JDKs installed you can use `/usr/libexec/java_home -v 21` to find the correct path.

### 1 — Start the database

```bash
docker compose up -d
```

This starts a MySQL 8 container on port `3306` with a persistent volume at `./data/mysql`. Wait ~15 seconds for the first-run initialisation to complete.

### 2 — Start the backend

```bash
mvn spring-boot:run
```

The API starts on **http://localhost:8080**. Hibernate will create or update the schema automatically on first boot (`ddl-auto=update`). Spring Boot 3.2 will automatically enable **Project Loom virtual threads** as configured.

### 3 — Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The app opens on **http://localhost:3000**.

---

## Default Credentials

On a fresh database, Meridian seeds a single admin account. Additional users must be created through the Admin → Users screen.

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | ADMIN |

---

## API Documentation

With the backend running, open the interactive Swagger UI:

```
http://localhost:8080/swagger-ui.html
```

All endpoints are grouped by controller and require a Bearer JWT token (except `POST /api/auth/login`). You can obtain a token directly from the Swagger UI's `/api/auth/login` endpoint and authorise subsequent requests via the **Authorize** button.

### Key endpoint groups

| Prefix | Description |
|---|---|
| `POST /api/auth/login` | Obtain a JWT token |
| `GET/PUT /api/users/me` | Current user profile (all roles) |
| `GET /api/students/me` | Student self-view |
| `GET /api/enrollments/me` | Student's enrolled courses |
| `POST /api/enrollments/me/course/{id}` | Student self-enrol |
| `GET /api/grades/me` | Student's own grades |
| `POST /api/grades/teacher` | Teacher adds grade for own course |
| `GET /api/attendance/teacher` | Teacher's attendance records |
| `POST /api/attendance/teacher` | Teacher adds attendance record |
| `POST /api/messages` | Send a message |
| `GET /api/messages/my-inbox` | Inbox for any role |
| `GET /api/inquiries/teacher` | Teacher's grade inquiries |
| `POST /api/inquiries` | Student submits grade inquiry |

---

## Project Structure

```
student-management/
├── docker-compose.yml            # MySQL service definition
├── pom.xml                       # Maven dependencies
├── src/main/
│   ├── java/com/example/studentmanagement/
│   │   ├── StudentManagementApplication.java
│   │   ├── config/               # CORS, Security, OpenAPI
│   │   ├── controller/           # REST controllers
│   │   ├── dto/                  # Request/response DTOs
│   │   ├── model/                # JPA entities
│   │   ├── repository/           # Spring Data repositories
│   │   ├── security/             # JWT filter & UserDetailsService
│   │   └── service/              # Business logic
│   └── resources/
│       └── application.properties
└── frontend/
    ├── index.html
    ├── package.json
    └── src/
        ├── api/                  # Axios API clients
        ├── components/           # Navbar, MeridianLogo, etc.
        ├── context/              # AuthContext, NotificationContext
        ├── pages/
        │   ├── Login.tsx
        │   ├── Profile.tsx
        │   ├── Users.tsx         # Admin unified users page
        │   ├── admin pages…
        │   ├── student/          # StudentDashboard, Courses, Grades…
        │   └── teacher/          # TeacherDashboard, Courses, Grades…
        └── types/                # TypeScript interfaces
```

---

## Role Reference

| Capability | Admin | Teacher | Student |
|---|:---:|:---:|:---:|
| Create / delete users | ✅ | — | — |
| Create courses | ✅ | — | — |
| Assign grades | ✅ | own courses | — |
| Add attendance | ✅ | own courses | — |
| View all students | ✅ | enrolled in course | — |
| View own grades | — | — | ✅ |
| Enrol in course | — | — | ✅ |
| Submit grade inquiry | — | — | ✅ |
| Message teachers | — | — | ✅ |
| Reply to student messages | — | ✅ | — |
| Respond to inquiries | — | ✅ | — |
| Upload profile photo | ✅ | ✅ | ✅ |

---

## Java 21 Modernisation

The backend was refactored to take full advantage of Java 21 language features and runtime improvements.

### Records for DTOs
All data-transfer objects are now Java **records** — immutable by default, zero boilerplate, no Lombok required:

```java
// Before (Lombok @Data class)
@Data
public class LoginRequest {
    @NotBlank private String username;
    @NotBlank private String password;
}

// After (Java 21 record)
public record LoginRequest(
        @NotBlank String username,
        @NotBlank String password) {}
```

`LoginRequest`, `RegisterRequest`, `AuthResponse`, and `CreateStudentRequest` are all records. `RegisterRequest` uses a compact constructor to apply a default role when none is supplied.

### Constructor injection everywhere
All services (`StudentService`, `AttendanceService`, `GradeService`, `EnrollmentService`, `CourseService`) and controllers replaced `@Autowired` field injection with `private final` fields + `@RequiredArgsConstructor`. This makes dependencies explicit, immutable, and trivially testable.

### Project Loom — virtual threads
`spring.threads.virtual.enabled=true` in `application.properties` switches Tomcat's request handler from a bounded platform-thread pool to **virtual threads** (M:N scheduling via Project Loom). Each HTTP request runs on its own cheap virtual thread — blocking I/O calls no longer pin a platform thread, dramatically increasing throughput under load without any code changes.

### `java.time.Instant` in JwtUtil
Token expiry and validation now use `Instant` instead of `new Date(System.currentTimeMillis() + ...)`:

```java
Instant now = Instant.now();
Jwts.builder()
    .issuedAt(Date.from(now))
    .expiration(Date.from(now.plusMillis(expirationMs)))
    ...
```

### Stream / collection improvements
- `.collect(Collectors.toList())` replaced with `.toList()` (Java 16+, available in 21)
- Result maps built with `Map.of(...)` instead of mutable `HashMap` + `put` chains
- `String.formatted(...)` used for interpolation where it improves readability

---

## License

MIT
