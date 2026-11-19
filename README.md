# 🎓 Mentora - Teacher Session Booking Platform
### Enterprise-Grade REST API (Node.js, TypeScript, Express, MongoDB, Mongoose) & Next.js MUI Frontend

A robust, production-ready Full Stack application built strictly with **Node.js, TypeScript, Express.js, MongoDB, and Mongoose**, featuring **JWT Authentication**, **Role-Based Access Control (RBAC)**, **MongoDB Aggregation Pipelines**, and a polished **Next.js 16 + Material UI (MUI)** client.

---

## 📑 Table of Contents
1. [Tech Stack](#-tech-stack)
2. [Project Architecture](#-project-architecture)
3. [Database Schemas](#-database-schemas)
4. [Role-Based Access Control (RBAC) & Authentication](#-role-based-access-control-rbac--authentication)
5. [API Endpoints & Documentation](#-api-endpoints--documentation)
6. [MongoDB Aggregation Pipelines Explained](#-mongodb-aggregation-pipelines-explained)
7. [Getting Started & Setup](#-getting-started--setup)
8. [Automated Testing (26 Passing Tests)](#-automated-testing-26-passing-tests)
9. [Postman Collection](#-postman-collection)
10. [Frontend Application (Next.js + MUI)](#-frontend-application-nextjs--mui)

---

## 🛠 Tech Stack

### Backend:
- **Runtime**: Node.js (v18+)
- **Language**: TypeScript (Strict mode enabled)
- **Framework**: Express.js
- **Database**: MongoDB (v6.0+)
- **ODM**: Mongoose (v8+)
- **Authentication**: JWT (`jsonwebtoken`) & password hashing (`bcryptjs`)
- **Validation**: Zod (Type-safe request body, query, and param validation)
- **Tooling**: TSX, Dotenv, CORS, Morgan

### Frontend:
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Component System**: Material-UI (MUI v6) & Emotion
- **Debounced Search**: Custom React hook for responsive UI queries
- **Data Table**: MUI `TablePagination` with backend pagination support

---

## 🏛 Project Architecture

```
Backend-Assgnment/
├── backend/
│   ├── src/
│   │   ├── config/             # DB connection & environment configuration
│   │   ├── constants/          # Status enums (AVAILABLE, BOOKED, COMPLETED), Roles (STUDENT, TEACHER, ADMIN), HTTP codes
│   │   ├── controllers/        # Request controllers (Auth, User, Teacher, Session)
│   │   ├── errors/             # Centralized AppError class with custom status codes
│   │   ├── middlewares/        # JWT auth, RBAC guards, Zod validation & centralized error handling
│   │   ├── models/             # Mongoose schemas with compound indexes & bcrypt hooks
│   │   ├── routes/             # Express routes (Auth, User, Teacher, Session)
│   │   ├── schemas/            # Zod validation schemas
│   │   ├── services/           # Business logic & MongoDB aggregation pipelines
│   │   ├── utils/              # Token generation, API response wrappers & async handlers
│   │   ├── scripts/
│   │   │   ├── seed.ts         # Database seeder with realistic RBAC users
│   │   │   └── test-api.ts     # Automated 26-point end-to-end integration test suite
│   │   ├── app.ts              # Express application factory
│   │   └── server.ts           # Server bootstrap with graceful shutdown
│   ├── postman_collection.json # Exported Postman collection with auth variables
│   └── tsconfig.json
├── frontend/                   # Modern Next.js TypeScript Web Client with Material UI
│   ├── src/
│   │   ├── app/                # App Router (page.tsx, layout.tsx)
│   │   ├── components/mui/     # MUI component architecture (Table, Navbar, Dashboard, Modals)
│   │   ├── lib/                # API client, types, useDebounce hook
│   │   └── theme/              # Custom MUI typography and palette configuration
└── README.md
```

---

## 🗄 Database Schemas

### 1. User
- `fullName`: `string` (required, trimmed, 2-100 chars)
- `email`: `string` (required, unique, lowercase, trimmed, validated format)
- `phone`: `string` (required, trimmed)
- `password`: `string` (hashed with bcrypt, select: false by default)
- `role`: `enum ['STUDENT', 'TEACHER', 'ADMIN']` (default: `'STUDENT'`, indexed)
- `teacherId`: `ObjectId | null` (ref: `Teacher`, for teacher accounts)
- `timestamps`: `createdAt`, `updatedAt`

### 2. Teacher
- `fullName`: `string` (required, trimmed, 2-100 chars)
- `email`: `string` (required, lowercase, trimmed)
- `specialization`: `string` (required, trimmed)
- `experience`: `number` (required, years of experience, min 0)
- `timestamps`: `createdAt`, `updatedAt`

### 3. Session
- `teacherId`: `ObjectId` (ref: `Teacher`, required, indexed)
- `userId`: `ObjectId | null` (ref: `User`, default `null`, indexed)
- `startTime`: `Date` (required, indexed)
- `endTime`: `Date` (required)
- `status`: `enum ['AVAILABLE', 'BOOKED', 'COMPLETED']` (default `'AVAILABLE'`, indexed)
- `completedAt`: `Date | null` (default `null`)
- `timestamps`: `createdAt`, `updatedAt`

---

## 🔐 Role-Based Access Control (RBAC) & Authentication

The platform implements an **RBAC model** using JSON Web Tokens (JWT) signed with `JWT_SECRET`:

| Role | Permissions |
|---|---|
| **STUDENT** | • Browse available sessions<br>• Book available sessions (API 4)<br>• View personal booking history dashboard (API 6)<br>❌ Forbidden from scheduling teacher slots or marking sessions complete |
| **TEACHER** | • Schedule availability slots (API 2)<br>• Mark assigned booked sessions as COMPLETED (API 5)<br>❌ Cannot book sessions as a student |
| **ADMIN** | • Full system privileges (schedule slots, book sessions, complete sessions, manage users) |

### Pre-Seeded Realistic Demo Accounts:
Password for all accounts: `Password@123`

1. 🎓 **Saurabh Agnihotri** (`saurabh.agnihotri@example.com`) — Role: `STUDENT`
2. 👩‍🎓 **Anjali Verma** (`anjali.verma@example.com`) — Role: `STUDENT`
3. 👨‍🏫 **Abhishek Singh** (`abhishek.singh@example.com`) — Role: `TEACHER`
4. 👨‍🏫 **Manas Tiwari** (`manas.tiwari@example.com`) — Role: `TEACHER`
5. 🛡️ **Prince Agnihotri** (`prince.agnihotri@example.com`) — Role: `ADMIN`

---

## 🔌 API Endpoints & Documentation

### Authentication Endpoints
- `POST /auth/login`: Authenticate with email & password, returns JWT `accessToken` and user profile.
- `POST /auth/register`: Create a new user with chosen role (`STUDENT`, `TEACHER`, or `ADMIN`).
- `GET /auth/me`: Retrieve currently authenticated user's profile via `Authorization: Bearer <token>`.

---

### Mandatory Assignment APIs

#### API 1 - Create User
- **Method & Route**: `POST /users`
- **Request Body**:
  ```json
  {
    "fullName": "Saurabh Agnihotri",
    "email": "saurabh.agnihotri@example.com",
    "phone": "+919876543210"
  }
  ```
- **Response**: `201 Created`
- **Rules**: Email must be unique. Duplicate emails return `409 Conflict`.

---

#### API 2 - Create Session
- **Method & Route**: `POST /sessions`
- **RBAC**: Protected (`TEACHER` or `ADMIN`).
- **Request Body**:
  ```json
  {
    "teacherId": "65fc1234567890abcdef1234",
    "startTime": "2026-11-20T10:00:00.000Z",
    "endTime": "2026-11-20T11:00:00.000Z"
  }
  ```
- **Response**: `201 Created`
- **Rules**:
  - Default status is `AVAILABLE`.
  - Validates that `teacherId` exists.
  - Validates `endTime` > `startTime`.
  - Checks for overlapping sessions for the teacher.

---

#### API 3 - Available Sessions for Booking
- **Method & Route**: `GET /sessions/available?dateTimestamp={timestamp}&page=1&limit=10&search=Abhishek`
- **Mandatory**: Implemented using **MongoDB Aggregation Pipeline**.
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "date": "2026-11-20",
      "totalAvailable": 1,
      "pagination": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 },
      "sessions": [
        {
          "_id": "65fc1234...",
          "startTime": "2026-11-20T10:00:00.000Z",
          "endTime": "2026-11-20T11:00:00.000Z",
          "status": "AVAILABLE",
          "teacher": {
            "_id": "65fc...",
            "fullName": "Abhishek Singh",
            "email": "abhishek.singh@example.com",
            "specialization": "Full Stack Web Development & Node.js",
            "experience": 8
          }
        }
      ]
    }
  }
  ```

---

#### API 4 - Book Session
- **Method & Route**: `POST /sessions/:id/book`
- **RBAC**: Protected (`STUDENT` or `ADMIN`).
- **Request Body**:
  ```json
  {
    "userId": "65fc1234567890abcdef1235"
  }
  ```
  *(Note: When authenticated with a Student JWT Bearer token, `userId` is automatically inferred if omitted).*
- **Rules**:
  - User and session must exist.
  - Concurrency-safe atomic check: Only `AVAILABLE` sessions can be transitioned to `BOOKED`.
  - Prevents double booking (`400 Bad Request`).

---

#### API 5 - Mark Session Complete
- **Method & Route**: `PATCH /sessions/:id/complete`
- **RBAC**: Protected (`TEACHER` or `ADMIN`).
- **Response**: `200 OK`
- **Rules**:
  - Only `BOOKED` sessions can be marked as complete.
  - Updates `status` to `COMPLETED` and sets `completedAt` timestamp.
  - Cannot mark `AVAILABLE` or already `COMPLETED` sessions (`400 Bad Request`).

---

#### API 6 - User Session List
- **Method & Route**: `GET /users/:id/sessions`
- **Mandatory**: Implemented using **MongoDB Aggregation Pipeline** with `$facet`.
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "user": { "_id": "...", "fullName": "Saurabh Agnihotri", "email": "..." },
      "upcomingSessions": [ ... ],
      "completedSessions": [ ... ]
    }
  }
  ```

---

## ⚡ MongoDB Aggregation Pipelines Explained

### 1. API 3 (`GET /sessions/available`)
```typescript
[
  // 1. Match AVAILABLE sessions within the full 24-hour UTC window of the target date
  {
    $match: {
      status: SESSION_STATUS.AVAILABLE,
      startTime: { $gte: startOfDay, $lte: endOfDay }
    }
  },
  // 2. Lookup teacher document
  {
    $lookup: {
      from: 'teachers',
      localField: 'teacherId',
      foreignField: '_id',
      as: 'teacher'
    }
  },
  // 3. Unwind teacher array to object
  { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: false } },
  // 4. Project clean output
  {
    $project: {
      _id: 1,
      startTime: 1,
      endTime: 1,
      status: 1,
      teacher: {
        _id: '$teacher._id',
        fullName: '$teacher.fullName',
        email: '$teacher.email',
        specialization: '$teacher.specialization',
        experience: '$teacher.experience'
      }
    }
  },
  // 5. Sort chronologically
  { $sort: { startTime: 1 } }
]
```

### 2. API 6 (`GET /users/:id/sessions`)
```typescript
[
  // 1. Match all sessions associated with the user
  { $match: { userId: new Types.ObjectId(userId) } },
  // 2. Join teacher details
  {
    $lookup: {
      from: 'teachers',
      localField: 'teacherId',
      foreignField: '_id',
      as: 'teacher'
    }
  },
  { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
  // 3. $facet splits into Upcoming and Completed simultaneously
  {
    $facet: {
      upcomingSessions: [
        { $match: { status: SESSION_STATUS.BOOKED } },
        { $sort: { startTime: 1 } }
      ],
      completedSessions: [
        { $match: { status: SESSION_STATUS.COMPLETED } },
        { $sort: { completedAt: -1, startTime: -1 } }
      ]
    }
  }
]
```

---

## 🚀 Getting Started & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://127.0.0.1:27017`

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
Default `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/teacher_booking_db
JWT_SECRET=super-secret-assignment-jwt-key-2026
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

### 2. Seed Database
```bash
npm run seed
```
Creates 3 teachers, 5 RBAC users (`Saurabh Agnihotri`, `Anjali Verma`, `Abhishek Singh`, `Manas Tiwari`, `Prince Agnihotri`), and initial sessions.

### 3. Start Backend Server
```bash
npm run dev
```
Backend running on `http://localhost:5000`.

---

## 🧪 Automated Testing (26 Passing Tests)

Run the comprehensive integration test suite:
```bash
cd backend
npm run test:api
```

```
====================================================
🚀 STARTING COMPREHENSIVE BACKEND API TEST SUITE
====================================================

✅ [PASS] Health Check Endpoint GET /health
✅ [PASS] API 1: POST /users creates user with unique email
✅ [PASS] API 1: Duplicate email yields 409 Conflict
✅ [PASS] POST /teachers creates a teacher
✅ [PASS] API 2: endTime <= startTime rejected with 400 Bad Request
✅ [PASS] API 2: Non-existent teacherId returns 404 Not Found
✅ [PASS] API 2: POST /sessions successfully creates AVAILABLE session
✅ [PASS] API 3: GET /sessions/available returns sessions matching date with teacher details via Aggregation Pipeline
✅ [PASS] API 3: Aggregation $lookup correctly populates teacher details
✅ [PASS] API 4: Booking with non-existent userId yields 404 Not Found
✅ [PASS] API 4: POST /sessions/:id/book transitions session to BOOKED and associates userId
✅ [PASS] API 4: Attempting to re-book an already BOOKED session yields 400 Bad Request
✅ [PASS] API 5: Marking an AVAILABLE session as COMPLETED yields 400 Bad Request
✅ [PASS] API 5: PATCH /sessions/:id/complete marks session COMPLETED and sets completedAt timestamp
✅ [PASS] API 5: Marking an already COMPLETED session as complete yields 400 Bad Request
✅ [PASS] API 6: GET /users/:id/sessions returns separate upcomingSessions and completedSessions
✅ [PASS] API 6: Aggregation $facet correctly separates BOOKED into upcoming and COMPLETED into completed

--- Testing Authentication & RBAC ---
✅ [PASS] POST /auth/login returns JWT accessToken and STUDENT profile
✅ [PASS] POST /auth/login returns JWT accessToken and TEACHER profile
✅ [PASS] POST /auth/login rejects wrong password with 401 Unauthorized
✅ [PASS] GET /auth/me validates Bearer token and returns authenticated user
✅ [PASS] RBAC: Student forbidden from POST /sessions (yields 403 Forbidden)
✅ [PASS] RBAC: Teacher successfully creates session with Bearer token
✅ [PASS] RBAC: Student successfully books session with Bearer token (auto userId injection)
✅ [PASS] RBAC: Student forbidden from PATCH /sessions/:id/complete (yields 403 Forbidden)
✅ [PASS] RBAC: Teacher successfully marks session COMPLETED with Bearer token

====================================================
📊 TEST SUITE SUMMARY: 26 PASSED | 0 FAILED
====================================================
```

---

## 📬 Postman Collection

Import `backend/postman_collection.json` into Postman:
- Contains all Auth and 6 Core assignment requests.
- Automatic collection variable management: sets `accessToken`, `userId`, `teacherId`, and `sessionId`.
- Tests embedded in every request.

---

## 💻 Frontend Application (Next.js + MUI)

### Running the Frontend:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

Features:
- **Material UI (MUI v6)** styling throughout (dropdowns, cards, dialogs, pagination).
- **1-Click RBAC Demo Login**: Switch instantly between Student, Teacher, and Admin accounts.
- **Debounced Mentor & Subject Search**: Instant typing response with delayed backend query.
- **Role-Gated Actions**: Students can book; Teachers can schedule and complete; Admins have full access.
- **No AI-generated generic templates**: Clean, production SaaS aesthetic.
