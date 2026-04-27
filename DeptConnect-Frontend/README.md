# 🏛️ DeptConnect — Backend API Documentation

> **A comprehensive guide to the DeptConnect backend**, written for frontend developers so you know exactly what the API does, how it works under the hood, and how to integrate with it.

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema (Entity Models)](#database-schema-entity-models)
5. [User Roles & Access Control](#user-roles--access-control)
6. [Authentication Flow](#authentication-flow)
7. [API Endpoints Reference](#api-endpoints-reference)
   - [Auth](#1-authentication-authcontroller)
   - [Users](#2-users-usercontroller)
   - [Announcements](#3-announcements-announcementcontroller)
   - [Documents](#4-documents-documentcontroller)
   - [Leave Requests](#5-leave-requests-leaverequestcontroller)
8. [Pagination Pattern](#pagination-pattern)
9. [Key Business Logic](#key-business-logic)
10. [DTO / Payload Reference](#dto--payload-reference)
11. [Error Handling](#error-handling)
12. [External Services](#external-services)
13. [Configuration Reference](#configuration-reference)
14. [Diagrams](#diagrams)

---

## Overview

**DeptConnect** is a departmental management system built with Spring Boot. It digitises three core workflows within a college department:

| Module | What it does |
|---|---|
| **Announcements** | HOD / Faculty post role-targeted announcements visible to specific audiences |
| **Documents** | HOD / Faculty upload, edit, and delete documents (stored on Cloudinary) |
| **Leave Requests** | Students / Faculty apply for leave; their designated approver (class teacher or HOD) approves or rejects |

The server runs on **`http://localhost:5001`**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Spring Boot 3.5.6 |
| **Language** | Java 21 |
| **Database** | MySQL 8 (`deptconnect` schema) |
| **ORM** | Spring Data JPA / Hibernate (auto DDL: `update`) |
| **Security** | Spring Security + JWT (jjwt 0.12.6) — stateless sessions |
| **File Storage** | Cloudinary (cloud-based media storage) |
| **Validation** | Jakarta Validation (`@NotBlank`, `@NotNull`, `@Email`) |
| **Code Gen** | Lombok (`@Data`, `@RequiredArgsConstructor`, etc.) |
| **Payments** | Razorpay + Stripe SDKs included (dependencies present, not yet wired) |
| **Mailing** | Spring Mail starter included (dependency present, not yet wired) |
| **API Docs** | Springdoc OpenAPI / Swagger UI |
| **Build** | Maven |

---

## Project Structure

```
DeptConnect/src/main/java/com/DeptConnect/
│
├── configuration/           ← Security, JWT, Cloudinary configs
│   ├── CloudinaryConfig.java
│   ├── JwtConstant.java
│   ├── JwtProvider.java
│   ├── JwtValidator.java
│   └── SecurityConfig.java
│
├── controller/              ← REST API endpoints
│   ├── AuthController.java
│   ├── AnnouncementController.java
│   ├── DocumentController.java
│   ├── LeaveRequestController.java
│   └── UserController.java
│
├── enums/                   ← Enum constants
│   ├── LeaveCategory.java
│   ├── LeaveStatus.java
│   ├── TargetRole.java
│   └── UserRole.java
│
├── exceptions/              ← Custom exception classes
│   ├── AccessDeniedException.java
│   ├── ResourceNotFoundException.java
│   └── UserException.java
│
├── mapper/                  ← Entity ↔ DTO converters
│   └── UserMapper.java
│
├── models/                  ← JPA Entity classes (DB tables)
│   ├── Announcement.java
│   ├── Document.java
│   ├── LeaveRequest.java
│   └── User.java
│
├── payload/
│   ├── dto/                 ← Data Transfer Objects (API responses)
│   │   ├── AnnouncementDto.java
│   │   ├── CreateLeaveRequestDto.java
│   │   ├── DocumentDto.java
│   │   ├── LeaveResponseDto.java
│   │   └── UserDto.java
│   ├── request/             ← Request bodies
│   │   ├── AnnouncementRequest.java
│   │   └── DocumentRequest.java
│   └── response/            ← Wrapper responses
│       ├── AuthResponse.java
│       └── PageResponse.java
│
├── repository/              ← Spring Data JPA repositories
│   ├── AnnouncementRepository.java
│   ├── DocumentRepository.java
│   ├── LeaveRequestRepository.java
│   └── UserRepository.java
│
├── service/                 ← Service interfaces
│   ├── AnnouncementService.java
│   ├── AuthService.java
│   ├── DocumentService.java
│   └── LeaveRequestService.java
│
└── service/impl/            ← Service implementations (business logic)
    ├── AnnouncementServiceImpl.java
    ├── AuthServiceImpl.java
    ├── CustomUserImplementation.java
    ├── DocumentServiceImpl.java
    └── LeaveRequestServiceImpl.java
```

---

## Database Schema (Entity Models)

### `users` table

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | BIGINT | PK, auto-increment | |
| `full_name` | VARCHAR | NOT NULL | |
| `email` | VARCHAR | NOT NULL, UNIQUE | Validated with `@Email` |
| `password` | VARCHAR | NOT NULL | BCrypt encoded |
| `role` | ENUM(STRING) | NOT NULL | `ROLE_ADMIN`, `ROLE_STUDENT`, `ROLE_FACULTY`, `ROLE_HOD` |
| `class_teacher_id` | BIGINT | FK → `users.id`, nullable | Only for students — points to their Faculty class teacher |
| `created_at` | DATETIME | | |
| `updated_at` | DATETIME | | |
| `last_login_at` | DATETIME | | Updated on every login |

**Relationships:**
- A **Student** `ManyToOne` → a **Faculty** (their class teacher)
- A **User** `OneToMany` → **Documents** they uploaded

---

### `announcements` table

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | BIGINT | PK, auto-increment | |
| `title` | VARCHAR | NOT NULL | |
| `body` | TEXT | | Long text content |
| `created_by_id` | BIGINT | FK → `users.id` | Eagerly fetched |
| `created_at` | DATETIME | | |
| `updated_at` | DATETIME | | |
| `target_role` | ENUM(STRING) | | `ROLE_STUDENT`, `ROLE_FACULTY`, `ROLE_HOD`, `ALL` |

---

### `documents` table

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | BIGINT | PK, auto-increment | |
| `title` | VARCHAR | NOT NULL | |
| `description` | TEXT | | |
| `file_url` | VARCHAR | NOT NULL | Cloudinary secure URL |
| `public_id` | VARCHAR | | Cloudinary public ID (used for delete/replace) |
| `uploaded_by_id` | BIGINT | FK → `users.id`, nullable | Lazily fetched |
| `file_size` | BIGINT | | In bytes |
| `uploaded_at` | DATETIME | | |
| `edited_at` | DATETIME | | |
| `target_role` | ENUM(STRING) | | `ROLE_STUDENT`, `ROLE_FACULTY`, `ROLE_HOD`, `ALL` |

---

### `leave_request` table

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | BIGINT | PK, auto-increment | |
| `user_id` | BIGINT | FK → `users.id` | The requester |
| `approver_id` | BIGINT | FK → `users.id`, nullable | Auto-assigned based on role logic |
| `category` | ENUM(STRING) | | `SICK`, `EXTRA_CURRICULAR`, `MEDICAL`, `PERSONAL` |
| `reason` | VARCHAR | NOT NULL | |
| `from_date` | DATE | | |
| `to_date` | DATE | | |
| `status` | ENUM(STRING) | default `PENDING` | `PENDING`, `APPROVED`, `REJECTED` |
| `created_at` | DATETIME | defaults to `now()` | |
| `approved_at` | DATETIME | nullable | Set on approve/reject |

---

## User Roles & Access Control

```
┌─────────────┐
│  ROLE_ADMIN  │  ← Reserved (signup blocked, cannot self-register)
├─────────────┤
│  ROLE_HOD    │  ← Head of Department (highest privileges)
│              │    • Creates/edits/deletes announcements & documents
│              │    • Can target any role
│              │    • Approves/rejects FACULTY leave requests
│              │    • Can edit/delete ANY document or announcement (override)
├─────────────┤
│ ROLE_FACULTY │  ← Faculty / Class Teacher
│              │    • Creates/edits/deletes own announcements & documents
│              │    • Default target → ROLE_STUDENT if not specified
│              │    • Approves/rejects STUDENT leave requests (their students)
│              │    • Can apply for leave (approved by HOD)
├─────────────┤
│ ROLE_STUDENT │  ← Student
│              │    • Views announcements & documents targeted to them
│              │    • Applies for leave (approved by their class teacher)
│              │    • Must select a class teacher during signup
└─────────────┘
```

### Method-Level Security (`@PreAuthorize`)

| Endpoint Pattern | Allowed Roles |
|---|---|
| `POST /api/announcements/create` | HOD, FACULTY |
| `GET /api/announcements` | STUDENT, FACULTY, HOD |
| `GET /api/announcements/{id}` | STUDENT, FACULTY, HOD |
| `PUT /api/announcements/update/{id}` | HOD, FACULTY (only creator or HOD) |
| `DELETE /api/announcements/delete/{id}` | HOD, FACULTY (only creator or HOD) |
| `POST /api/documents/upload` | HOD, FACULTY |
| `GET /api/documents` | STUDENT, FACULTY, HOD |
| `GET /api/documents/{id}` | STUDENT, FACULTY, HOD |
| `PUT /api/documents/edit/{id}` | HOD, FACULTY (only uploader or HOD) |
| `DELETE /api/documents/delete/{id}` | HOD, FACULTY (only uploader or HOD) |
| `POST /api/leaves/create` | STUDENT, FACULTY |
| `GET /api/leaves` | STUDENT, FACULTY |
| `GET /api/leaves/pending` | HOD, FACULTY |
| `PUT /api/leaves/{id}/approve` | Assigned approver only |
| `PUT /api/leaves/{id}/reject` | Assigned approver only |
| `GET /api/users/faculties` | Any authenticated user |

---

## Authentication Flow

### How it works

1. **Signup** → `POST /auth/signup` — creates user, returns success message + user data (no JWT on signup)
2. **Login** → `POST /auth/login` — validates credentials, returns **JWT token** + user data
3. **Subsequent requests** → send the JWT in the `Authorization` header:
   ```
   Authorization: Bearer <jwt_token>
   ```
4. **JwtValidator filter** runs **before** every `/api/**` request, extracts email + authorities from token, sets SecurityContext

### JWT Token Structure

The JWT contains:
- `email` — the user's email (used as the principal)
- `authorities` — comma-separated role string (e.g., `ROLE_STUDENT`)
- `iat` — issued-at timestamp
- `exp` — expiration timestamp

### Password Handling

- Passwords are **BCrypt-encoded** before storage
- On login, `passwordEncoder.matches()` compares the raw password with the stored hash

### CORS Configuration

- **All origins** allowed (wildcard `*`)
- **All methods** allowed
- **All headers** allowed
- `Authorization` header is **exposed** to the client
- Credentials: **enabled**
- Max age: **3600s** (1 hour)

---

## API Endpoints Reference

### 1. Authentication (`AuthController`)

**Base URL:** `/auth`

---

#### `POST /auth/signup`

Register a new user.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "ROLE_STUDENT",
  "classTeacherId": 5
}
```

> ⚠️ `classTeacherId` is **required** when `role` is `ROLE_STUDENT` — must point to a valid `ROLE_FACULTY` user.
> ⚠️ `ROLE_ADMIN` signup is **blocked** by the backend.

**Response:**
```json
{
  "jwt": null,
  "message": "Registered Successfully",
  "user": {
    "id": 10,
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "ROLE_STUDENT",
    "classTeacherId": 5,
    "classTeacherName": "Prof. Smith",
    "createdAt": "2026-03-12T22:00:00",
    "updatedAt": "2026-03-12T22:00:00",
    "lastLoginAt": "2026-03-12T22:00:00"
  }
}
```

---

#### `POST /auth/login`

Login and receive a JWT.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "jwt": "eyJhbGciOi...",
  "message": "Logged In Successfully",
  "user": {
    "id": 10,
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "ROLE_STUDENT",
    "classTeacherId": 5,
    "classTeacherName": "Prof. Smith",
    "createdAt": "2026-03-12T22:00:00",
    "updatedAt": "2026-03-12T22:00:00",
    "lastLoginAt": "2026-03-12T22:30:00"
  }
}
```

---

### 2. Users (`UserController`)

**Base URL:** `/api/users`

---

#### `GET /api/users/faculties`

Returns a list of all users with `ROLE_FACULTY`. Used in the **signup form** for students to pick their class teacher.

**Response:**
```json
[
  {
    "id": 5,
    "fullName": "Prof. Smith",
    "email": "smith@college.edu",
    "role": "ROLE_FACULTY",
    "classTeacherId": null,
    "classTeacherName": null,
    "createdAt": "2026-01-01T10:00:00",
    "updatedAt": "2026-01-01T10:00:00",
    "lastLoginAt": "2026-03-12T08:00:00"
  }
]
```

---

### 3. Announcements (`AnnouncementController`)

**Base URL:** `/api/announcements`

> 🔒 All endpoints require a valid JWT in the `Authorization` header.

---

#### `POST /api/announcements/create`

**Roles:** `HOD`, `FACULTY`

Create a new announcement.

**Request Body:**
```json
{
  "title": "Mid-Semester Exam Schedule",
  "body": "Exams will begin from April 15th...",
  "targetRole": "ROLE_STUDENT"
}
```

> 💡 If `targetRole` is **not provided** and the user is `ROLE_FACULTY`, it **defaults to `ROLE_STUDENT`**.

**Response:** `AnnouncementDto` (see [DTO Reference](#announcementdto))

---

#### `GET /api/announcements`

**Roles:** `STUDENT`, `FACULTY`, `HOD`

Get paginated announcements **filtered by the logged-in user's role**. A student sees announcements targeted to `ROLE_STUDENT` or `ALL`. A faculty sees `ROLE_FACULTY` or `ALL`, etc.

**Query Params:**

| Param | Default | Description |
|---|---|---|
| `page` | `0` | Page number (0-indexed) |
| `size` | `10` | Items per page |
| `sortBy` | `createdAt` | Field to sort by |
| `sortDir` | `desc` | Sort direction (`asc` or `desc`) |

**Response:** `PageResponse<AnnouncementDto>` (see [Pagination Pattern](#pagination-pattern))

---

#### `GET /api/announcements/{id}`

**Roles:** `STUDENT`, `FACULTY`, `HOD`

Get a single announcement by ID. Returns **403** if the announcement's `targetRole` doesn't match the user's role (unless it's `ALL`).

---

#### `PUT /api/announcements/update/{id}`

**Roles:** `HOD`, `FACULTY` (only the **creator** or **HOD** can update)

**Request Body:**
```json
{
  "title": "Updated Title",
  "body": "Updated content...",
  "targetRole": "ALL"
}
```

---

#### `DELETE /api/announcements/delete/{id}`

**Roles:** `HOD`, `FACULTY` (only the **creator** or **HOD** can delete)

**Response:** `"Announcement deleted successfully"`

---

### 4. Documents (`DocumentController`)

**Base URL:** `/api/documents`

> 🔒 All endpoints require a valid JWT in the `Authorization` header.

---

#### `POST /api/documents/upload`

**Roles:** `HOD`, `FACULTY`

Upload a document with a file (to Cloudinary).

**Content-Type:** `multipart/form-data`

| Part | Type | Required | Description |
|---|---|---|---|
| `file` | Binary | ✅ | The file to upload |
| `meta` | JSON | ✅ | `DocumentRequest` object |

**`meta` JSON:**
```json
{
  "title": "Syllabus PDF",
  "description": "Updated syllabus for Semester 6",
  "targetRole": "ROLE_STUDENT"
}
```

> 💡 If `targetRole` is **not provided** and user is `ROLE_FACULTY`, it **defaults to `ROLE_STUDENT`**.

**Response:** `DocumentDto` with HTTP **201 Created**

---

#### `GET /api/documents`

**Roles:** `STUDENT`, `FACULTY`, `HOD`

Get paginated documents filtered by role (same logic as announcements).

**Query Params:**

| Param | Default | Description |
|---|---|---|
| `page` | `0` | Page number (0-indexed) |
| `size` | `10` | Items per page |
| `sortBy` | `uploadedAt` | Field to sort by |
| `sortDir` | `desc` | Sort direction |

**Response:** `PageResponse<DocumentDto>`

---

#### `GET /api/documents/{id}`

**Roles:** `STUDENT`, `FACULTY`, `HOD`

Get a single document. Access is checked against `targetRole`.

---

#### `PUT /api/documents/edit/{id}`

**Roles:** `HOD`, `FACULTY` (only the **uploader** or **HOD** can edit)

**Content-Type:** `multipart/form-data`

| Part | Type | Required | Description |
|---|---|---|---|
| `file` | Binary | ❌ Optional | New file (old file is deleted from Cloudinary if provided) |
| `meta` | JSON | ✅ | Updated `DocumentRequest` |

> 💡 If a new file is uploaded, the old file is **automatically deleted from Cloudinary** before the new one is stored.

---

#### `DELETE /api/documents/delete/{id}`

**Roles:** `HOD`, `FACULTY` (only the **uploader** or **HOD** can delete)

> The file is **also deleted from Cloudinary** (not just the database record).

**Response:** `"Document deleted successfully"`

---

### 5. Leave Requests (`LeaveRequestController`)

**Base URL:** `/api/leaves`

> 🔒 All endpoints require a valid JWT in the `Authorization` header.

---

#### `POST /api/leaves/create`

**Roles:** `STUDENT`, `FACULTY`

Create a leave request.

**Request Body:**
```json
{
  "category": "SICK",
  "reason": "Fever and body ache",
  "fromDate": "2026-03-15",
  "toDate": "2026-03-17"
}
```

**Leave Categories:** `SICK` | `EXTRA_CURRICULAR` | `MEDICAL` | `PERSONAL`

> 💡 **Approver is auto-assigned:**
> - If the requester is a **Student** → approver = their **class teacher** (faculty)
> - If the requester is a **Faculty** → approver = the **HOD**

**Validation:**
- `fromDate` must be **before or equal to** `toDate`
- Students must have a `classTeacher` assigned

**Response:** `LeaveResponseDto` with HTTP **201 Created**

---

#### `GET /api/leaves`

**Roles:** `STUDENT`, `FACULTY`

Get **my** leave requests (paginated).

**Query Params:** Same pagination pattern (`page`, `size`, `sortBy`, `sortDir`)

**Response:** `PageResponse<LeaveResponseDto>`

---

#### `GET /api/leaves/pending`

**Roles:** `HOD`, `FACULTY`

Get leave requests **pending my approval** (paginated). Only returns leaves where the current user is the assigned approver AND status is `PENDING`.

**Query Params:** Same pagination pattern

**Response:** `PageResponse<LeaveResponseDto>`

---

#### `PUT /api/leaves/{id}/approve`

**Roles:** Only the **assigned approver** for that leave request

Approve a pending leave request.

**Response:**
```json
{
  "id": 1,
  "requesterId": 10,
  "requesterName": "John Doe",
  "approverId": 5,
  "approverName": "Prof. Smith",
  "category": "SICK",
  "reason": "Fever and body ache",
  "fromDate": "2026-03-15",
  "toDate": "2026-03-17",
  "status": "APPROVED",
  "createdAt": "2026-03-14T10:00:00",
  "approvedAt": "2026-03-14T14:30:00"
}
```

---

#### `PUT /api/leaves/{id}/reject`

**Roles:** Only the **assigned approver** for that leave request

Reject a pending leave request with an optional note.

**Request Body (optional):**
```json
{
  "note": "Insufficient documentation provided"
}
```

> The rejection note is **appended** to the original reason field as:
> `[Rejection note by approver]: <note>`

---

## Pagination Pattern

All list endpoints return a **standardised `PageResponse<T>`**:

```json
{
  "data": [ ... ],
  "page": 0,
  "size": 10,
  "totalElements": 47,
  "totalPages": 5,
  "last": false
}
```

| Field | Type | Description |
|---|---|---|
| `data` | `T[]` | Array of items for the current page |
| `page` | `int` | Current page number (0-indexed) |
| `size` | `int` | Items per page |
| `totalElements` | `long` | Total count across all pages |
| `totalPages` | `int` | Total number of pages |
| `last` | `boolean` | `true` if this is the last page |

**Common query parameters for all paginated endpoints:**

```
?page=0&size=10&sortBy=createdAt&sortDir=desc
```

---

## Key Business Logic

### 1. Role-Based Content Filtering

Announcements and Documents have a `targetRole` field. When a user fetches the list:
- The backend filters to show items where `targetRole` is **`ALL`** OR matches the **user's own role**.
- Example: A `ROLE_STUDENT` sees items targeted to `ROLE_STUDENT` or `ALL`.

### 2. Automatic Approver Assignment (Leave Requests)

```
Student creates leave  →  approver = student's classTeacher (a Faculty)
Faculty creates leave  →  approver = the HOD (first user with ROLE_HOD)
```

This is handled by `determineApproverFor()` in `LeaveRequestServiceImpl`.

### 3. Ownership-Based Authorization

For update/delete operations on Announcements and Documents:
- ✅ The **original creator/uploader** can modify
- ✅ The **HOD** can modify any item (override privilege)
- ❌ Others get `AccessDeniedException`

### 4. Cloudinary File Lifecycle

- **Upload:** Files are uploaded to `deptconnect/documents/` folder on Cloudinary
- **Edit:** If a new file is provided, the **old file is deleted** from Cloudinary first, then the new file is uploaded
- **Delete:** The file is **deleted from Cloudinary** AND the database record is removed

### 5. Default Target Role for Faculty

When a Faculty creates an announcement or document **without specifying `targetRole`**, it automatically defaults to `ROLE_STUDENT`.

---

## DTO / Payload Reference

### `AuthResponse`
```json
{
  "jwt": "string | null",
  "message": "string",
  "user": { /* UserDto */ }
}
```

### `UserDto`
```json
{
  "id": "long",
  "fullName": "string",
  "email": "string",
  "role": "ROLE_ADMIN | ROLE_STUDENT | ROLE_FACULTY | ROLE_HOD",
  "password": "string (only in request)",
  "classTeacherId": "long | null",
  "classTeacherName": "string | null",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "lastLoginAt": "datetime"
}
```

### `AnnouncementDto`
```json
{
  "id": "long",
  "title": "string",
  "body": "string",
  "createdByFullName": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "targetRole": "ROLE_STUDENT | ROLE_FACULTY | ROLE_HOD | ALL"
}
```

### `DocumentDto`
```json
{
  "id": "long",
  "title": "string",
  "description": "string",
  "fileUrl": "string (Cloudinary URL)",
  "uploadedByFullName": "string",
  "uploadedAt": "datetime",
  "editedAt": "datetime | null",
  "targetRole": "ROLE_STUDENT | ROLE_FACULTY | ROLE_HOD | ALL",
  "fileSize": "long (bytes)",
  "readableSize": "string (e.g. '2.45 MB')"
}
```

### `LeaveResponseDto`
```json
{
  "id": "long",
  "requesterId": "long",
  "requesterName": "string",
  "approverId": "long",
  "approverName": "string",
  "category": "SICK | EXTRA_CURRICULAR | MEDICAL | PERSONAL",
  "reason": "string",
  "fromDate": "date (YYYY-MM-DD)",
  "toDate": "date (YYYY-MM-DD)",
  "status": "PENDING | APPROVED | REJECTED",
  "createdAt": "datetime",
  "approvedAt": "datetime | null"
}
```

### `AnnouncementRequest` (Create/Update body)
```json
{
  "title": "string (required)",
  "body": "string (required)",
  "targetRole": "ROLE_STUDENT | ROLE_FACULTY | ROLE_HOD | ALL (optional)"
}
```

### `DocumentRequest` (Metadata part of multipart upload)
```json
{
  "title": "string (required)",
  "description": "string (required)",
  "targetRole": "ROLE_STUDENT | ROLE_FACULTY | ROLE_HOD | ALL (optional)"
}
```

### `CreateLeaveRequestDto`
```json
{
  "category": "SICK | EXTRA_CURRICULAR | MEDICAL | PERSONAL (required)",
  "reason": "string (required)",
  "fromDate": "YYYY-MM-DD (required)",
  "toDate": "YYYY-MM-DD (required)"
}
```

---

## Error Handling

The backend uses three custom exceptions:

| Exception | When thrown |
|---|---|
| `UserException` | User not found, email already registered, invalid class teacher, etc. |
| `AccessDeniedException` | User tries to modify/view a resource they don't own or aren't authorized for |
| `ResourceNotFoundException` | Requested announcement/document/leave not found by ID |

---

## External Services

### Cloudinary (File Storage)

- **Purpose:** Stores document files (PDFs, images, etc.)
- **Folder:** `deptconnect/documents/`
- **Operations used:** `upload`, `destroy`
- Files uploaded with `resource_type: auto` (auto-detects file type)
- The `secure_url` (HTTPS) is stored in the DB
- The `public_id` is stored for future delete/replace operations

### Razorpay & Stripe

- Dependencies are included in `pom.xml` but **not yet integrated** into any controllers or services
- Likely planned for future payment features (e.g., exam fees, department dues)

### Spring Mail

- Dependency included but **not yet wired** into any service
- Likely planned for email notifications (leave approval, announcements, etc.)

---

## Configuration Reference

| Property | Value | Notes |
|---|---|---|
| Server Port | `5001` | Binds to `0.0.0.0` (accessible on network) |
| Database URL | `jdbc:mysql://localhost:3306/deptconnect` | MySQL 8 |
| DDL Auto | `update` | Auto-creates/updates tables |
| SQL Logging | `true` | SQL statements shown in console |
| Hibernate Dialect | `MySQL8Dialect` | |

---

## Diagrams

The `Diagrams/` folder in the backend project contains:

| File | Description |
|---|---|
| `Entity Relationship Diagram.pdf` | Database ER diagram showing all table relationships |
| `Use Case Diagram.pdf` | UML use case diagram showing actor interactions |
| `DATA FLOW.pdf` | Data flow diagram showing how data moves through the system |

---

## Quick-Start for Frontend Developers

1. **First**, call `GET /api/users/faculties` to populate the class teacher dropdown on the signup page
2. Call `POST /auth/signup` to register, then `POST /auth/login` to get a JWT
3. Store the JWT and send it as `Authorization: Bearer <token>` with every `/api/*` request
4. Use the paginated endpoints with `?page=0&size=10` for lists
5. All dates in responses are ISO format — `fromDate`/`toDate` as `YYYY-MM-DD`, timestamps as `YYYY-MM-DDTHH:mm:ss`
6. For document upload, use `multipart/form-data` with two parts: `file` (binary) and `meta` (JSON string)

---

*Generated from the DeptConnect backend source code (45 Java files) and OpenAPI specification.*
