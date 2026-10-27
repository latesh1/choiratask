# Project & Task Management REST API

> Production-conscious backend assignment for the Backend Developer interview at **Choira MusicTech**.  
> Built with Node.js, Express, MySQL (mysql2 with parameterized queries), MongoDB (Mongoose), JWT, and Jest.

---

## 1. Project Overview

This backend service provides a robust, multi-tenant project and task management system designed to coordinate audio technology workflows. It showcases a hybrid database architecture:
- **MySQL (Relational Database)**: Stores ACID-critical entities including **Users** and **Projects**, enforcing strict foreign keys, unique email constraints, and relational integrity.
- **MongoDB (Document Database)**: Stores dynamic **Tasks**, supporting flexible document schemas, sub-second indexing, and rich aggregation pipelines for real-time dashboards.

---

## 2. Technologies Used

- **Runtime**: Node.js (CommonJS, Node v18+ / v20+ / v24+)
- **Web Framework**: Express.js
- **Relational Storage**: MySQL with `mysql2/promise` (connection pooling & parameterized SQL)
- **Document Storage**: MongoDB with `mongoose`
- **Security & Cryptography**:
  - `bcryptjs` (salted password hashing)
  - `jsonwebtoken` (stateless HMAC-SHA256 bearer tokens)
  - `helmet` (HTTP security headers)
  - `cors` (Cross-Origin Resource Sharing control)
- **Validation**: `express-validator` (strict schema, param, and query validation)
- **Testing**: `jest` & `supertest`
- **Development**: `nodemon` & `dotenv`

---

## 3. Architecture & Directory Structure

```text
choira/
├── src/
│   ├── app.js                     # Express application configuration & middleware pipeline
│   ├── server.js                  # Database connection validation, server listener, & graceful shutdown
│   ├── config/
│   │   ├── env.js                 # Centralized environment variable validation
│   │   ├── mysql.js               # MySQL connection pool & parameterized query runner
│   │   └── mongodb.js             # Mongoose connection & lifecycle manager
│   ├── models/
│   │   └── task.model.js          # Mongoose Task schema, indexes, and transformations
│   ├── routes/
│   │   ├── auth.routes.js         # Authentication & profile routes
│   │   ├── project.routes.js      # Project management routes
│   │   ├── task.routes.js         # Task CRUD & query routes
│   │   └── dashboard.routes.js    # Aggregated metrics route
│   ├── controllers/
│   │   ├── auth.controller.js     # Auth request handling
│   │   ├── project.controller.js  # Project request handling
│   │   ├── task.controller.js     # Task request handling
│   │   └── dashboard.controller.js# Dashboard request handling
│   ├── services/
│   │   ├── auth.service.js        # User hashing, JWT issuing, profile updates
│   │   ├── project.service.js     # Project CRUD, ownership enforcement, cascading cleanup
│   │   ├── task.service.js        # Task CRUD, project reference validation, filtering & pagination
│   │   └── dashboard.service.js   # MySQL & MongoDB aggregate metric queries
│   ├── middleware/
│   │   ├── auth.middleware.js     # Bearer JWT verification & req.user injection
│   │   ├── validate.middleware.js # Express-validator result formatter (422)
│   │   ├── not-found.middleware.js# JSON 404 handler for unknown routes
│   │   └── error.middleware.js    # Centralized operational error & exception handler
│   ├── validators/
│   │   ├── auth.validator.js      # User registration, login, and profile validation
│   │   ├── project.validator.js   # Project fields, IDs, and statuses validation
│   │   └── task.validator.js      # Task creation, update, ID, and query filter validation
│   └── utils/
│       ├── app-error.js           # Custom operational error class
│       ├── async-handler.js       # Asynchronous route error wrapper
│       └── responses.js           # Consistent success & error JSON envelope helpers
├── database/
│   └── schema.sql                 # MySQL DDL schema initialization script
├── tests/
│   ├── auth.test.js               # Unit/integration tests for auth & JWT
│   ├── projects.test.js           # Tests for project CRUD & ownership rules
│   ├── tasks.test.js              # Tests for task CRUD, filters, pagination, project reference
│   ├── dashboard.test.js          # Tests for aggregate metrics
│   └── security-and-errors.test.js# Tests for 404, health check, and malformed inputs
├── postman/
│   ├── choira-api.postman_collection.json # Complete Postman API collection
│   └── choira-api.postman_environment.json# Postman environment variables
├── .env.example                   # Safe template for environment variables
├── .gitignore
├── package.json
└── README.md
```

---

## 4. Prerequisites

- **Node.js**: `v18.0.0` or higher (`v24.x` recommended)
- **npm**: `v9.0.0` or higher
- **MySQL Server**: `v5.7+` or `v8.0+`
- **MongoDB**: `v5.0+` or MongoDB Atlas URI

---

## 5. Installation & Setup

### Step 1: Clone or navigate to the project directory
```bash
cd choira
```

### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your database credentials:
```env
PORT=5000
NODE_ENV=development

JWT_SECRET=super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=choira_db

MONGODB_URI=mongodb://localhost:27017/choira_db

CORS_ORIGIN=*
```

### Step 4: Initialize MySQL Schema
Run the initialization script against your MySQL instance:
```bash
mysql -u root -p < database/schema.sql
```
Or execute the contents of `database/schema.sql` inside MySQL Workbench, phpMyAdmin, or your preferred SQL client:
```sql
CREATE DATABASE IF NOT EXISTS `choira_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `choira_db`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('active', 'completed', 'archived') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_projects_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_projects_user_id` (`user_id`),
  INDEX `idx_projects_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Step 5: Initialize MongoDB
MongoDB automatically creates collections and indexes upon starting the application when Mongoose connects.

---

## 6. Running the Application

### Development Mode (with nodemon hot reloading)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Health Check
Verify the server is up and responsive:
```http
GET http://localhost:5000/health
```
Response:
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "UP",
    "timestamp": "2026-10-27T09:50:00.000Z",
    "environment": "development"
  }
}
```

### Interactive Swagger UI Documentation
The API includes complete interactive Swagger OpenAPI 3.0 documentation:
- **Interactive Swagger UI**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- **OpenAPI Specification JSON**: [http://localhost:5000/api-docs.json](http://localhost:5000/api-docs.json)

#### How to Authorize & Test Endpoints in Swagger UI:
1. Open [http://localhost:5000/api-docs](http://localhost:5000/api-docs) in your browser.
2. In the **Authentication** section, expand `POST /api/auth/login` (or `/api/auth/register`), click **Try it out**, and submit your credentials (`latesh.billava11@gmail.com` / `MusicProd#2026`).
3. Copy the returned `token` string from the JSON response.
4. Scroll to the top and click the green **Authorize 🔓** button.
5. Enter the token into the Value field and click **Authorize**.
6. You can now execute any protected Project, Task, or Dashboard endpoint directly from the browser!

---

## 7. Running Automated Tests

The test suite is built with **Jest** and **Supertest**. It uses decoupled in-memory mocks to test all business logic, validation rules, security checks, and error responses deterministically without requiring running external database servers.

Run tests:
```bash
npm test
```

### Test Coverage Highlights
- ✅ **Authentication**: User registration, bcrypt password hashing, duplicate email rejection (409), login validation, JWT issuance, generic 401 login failure, and token expiration handling.
- ✅ **Ownership Isolation**: Ensuring User A cannot read, update, or delete User B's projects or tasks (returns 404 without disclosure).
- ✅ **Cascading Cleanup**: Verifying that deleting a project cleans up all associated MongoDB tasks.
- ✅ **Cross-Database Integrity**: Verifying that creating or reassigning a task to a non-existent or unowned MySQL project is rejected with 404.
- ✅ **Validation & Enums**: Enforcing valid statuses (`active`, `completed`, `archived` for projects; `todo`, `in_progress`, `completed` for tasks) and priorities (`low`, `medium`, `high`).
- ✅ **Filtering & Pagination**: Testing `page`, `limit`, `status`, `priority`, `projectId`, `totalRecords`, and `totalPages`, and strict rejection of unrecognized query parameters.
- ✅ **Dashboard Aggregations**: Computing MySQL and MongoDB metrics and ensuring all returned values are integers.

---

## 8. API Specification

All protected endpoints require an `Authorization` header formatted as:
```text
Authorization: Bearer <your_jwt_token>
```

### Consistent JSON Format

#### Success Envelope
```json
{
  "success": true,
  "message": "Human-readable message",
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalRecords": 25,
    "totalPages": 3
  }
}
```

#### Error Envelope
```json
{
  "success": false,
  "message": "A clear description of the error",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

---

### Endpoints Table

| Category | Method | Path | Auth Required | Description |
| :--- | :--- | :--- | :---: | :--- |
| **System** | `GET` | `/health` | No | Service health check |
| **Auth** | `POST` | `/api/auth/register` | No | Register new user |
| **Auth** | `POST` | `/api/auth/login` | No | Login and obtain JWT token |
| **Auth** | `GET` | `/api/auth/me` | **Yes** | Retrieve authenticated profile |
| **Auth** | `PUT` | `/api/auth/profile` | **Yes** | Update user profile (name, email) |
| **Projects** | `POST` | `/api/projects` | **Yes** | Create new project |
| **Projects** | `GET` | `/api/projects` | **Yes** | List user's projects |
| **Projects** | `GET` | `/api/projects/:id` | **Yes** | Get project by ID |
| **Projects** | `PUT` | `/api/projects/:id` | **Yes** | Update project by ID |
| **Projects** | `DELETE` | `/api/projects/:id` | **Yes** | Delete project and associated tasks |
| **Tasks** | `POST` | `/api/tasks` | **Yes** | Create new task for an owned project |
| **Tasks** | `GET` | `/api/tasks` | **Yes** | Filter and paginate tasks |
| **Tasks** | `GET` | `/api/tasks/:id` | **Yes** | Get task by MongoDB ObjectId |
| **Tasks** | `PUT` | `/api/tasks/:id` | **Yes** | Update task by ID |
| **Tasks** | `DELETE` | `/api/tasks/:id` | **Yes** | Delete task by ID |
| **Dashboard** | `GET` | `/api/dashboard` | **Yes** | Get cross-database metrics |

---

## 9. Request / Response Samples

### 1. Register User
`POST /api/auth/register`
```json
{
  "name": "Jane Producer",
  "email": "jane@choiramusic.com",
  "password": "Password123"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "Jane Producer",
      "email": "jane@choiramusic.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login
`POST /api/auth/login`
```json
{
  "email": "jane@choiramusic.com",
  "password": "Password123"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Jane Producer",
      "email": "jane@choiramusic.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Create Project
`POST /api/projects`
```json
{
  "name": "Spatial Audio Reverb VST",
  "description": "Convolution reverb DSP engine with 3D ambisonics",
  "status": "active"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "project": {
      "id": 1,
      "user_id": 1,
      "name": "Spatial Audio Reverb VST",
      "description": "Convolution reverb DSP engine with 3D ambisonics",
      "status": "active",
      "created_at": "2026-10-27T10:00:00.000Z",
      "updated_at": "2026-10-27T10:00:00.000Z"
    }
  }
}
```

### 4. Create Task
`POST /api/tasks`
```json
{
  "title": "Optimize Fast Fourier Transform (FFT) kernel",
  "description": "Vectorize FFT butterfly operations using AVX-512 instructions",
  "projectId": 1,
  "status": "in_progress",
  "priority": "high",
  "dueDate": "2026-12-15T18:00:00.000Z"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "task": {
      "_id": "671e0f31c26f63412cbdf321",
      "title": "Optimize Fast Fourier Transform (FFT) kernel",
      "description": "Vectorize FFT butterfly operations using AVX-512 instructions",
      "projectId": 1,
      "userId": 1,
      "status": "in_progress",
      "priority": "high",
      "dueDate": "2026-12-15T18:00:00.000Z",
      "createdAt": "2026-10-27T10:05:00.000Z",
      "updatedAt": "2026-10-27T10:05:00.000Z"
    }
  }
}
```

### 5. Filtered & Paginated Tasks
`GET /api/tasks?page=1&limit=10&status=in_progress&priority=high&projectId=1`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Tasks retrieved successfully",
  "data": [
    {
      "_id": "671e0f31c26f63412cbdf321",
      "title": "Optimize Fast Fourier Transform (FFT) kernel",
      "description": "Vectorize FFT butterfly operations using AVX-512 instructions",
      "projectId": 1,
      "userId": 1,
      "status": "in_progress",
      "priority": "high",
      "dueDate": "2026-12-15T18:00:00.000Z",
      "createdAt": "2026-10-27T10:05:00.000Z",
      "updatedAt": "2026-10-27T10:05:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalRecords": 1,
    "totalPages": 1
  }
}
```

### 6. Dashboard Metrics
`GET /api/dashboard`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "totalProjects": 3,
    "activeProjects": 2,
    "completedProjects": 1,
    "totalTasks": 12,
    "pendingTasks": 8,
    "completedTasks": 4,
    "highPriorityTasks": 5
  }
}
```

---

## 10. Dashboard Metric Definitions

- **`totalProjects`**: Total count of MySQL projects owned by the authenticated user (`COUNT(*)`).
- **`activeProjects`**: Projects owned by the user where `status = 'active'`.
- **`completedProjects`**: Projects owned by the user where `status = 'completed'`.
- **`totalTasks`**: Total count of MongoDB tasks belonging to the authenticated user.
- **`pendingTasks`**: Tasks belonging to the user with `status: 'todo'` or `status: 'in_progress'`.
- **`completedTasks`**: Tasks belonging to the user with `status: 'completed'`.
- **`highPriorityTasks`**: Tasks belonging to the user with `priority: 'high'` (regardless of status).

---

## 11. Important Design Decisions & Policies

### 1. Multi-Database ID Representation
MySQL project IDs and user IDs are integers, whereas MongoDB document IDs are 24-character hexadecimal `ObjectId`s. In the MongoDB `Task` schema, `projectId` and `userId` are stored as native **Numbers** (integers), never converted to `ObjectId`. Inputs are strictly validated with integer checks (`Number.isInteger`, `isInt({ min: 1 })`).

### 2. Task Ownership & Cross-Database Project Validation
A task cannot exist in isolation. Before a task can be created or reassigned to a different project:
1. The server performs a parameterized SQL query checking `SELECT id FROM projects WHERE id = ? AND user_id = ?`.
2. If the project does not exist or belongs to another user, the request fails with `404 Not Found`.
3. The authenticated user's ID is extracted exclusively from the validated JWT token—never from client request body parameters.

### 3. Cascading Project Deletion Policy
When a user deletes a project (`DELETE /api/projects/:id`):
1. Ownership is verified in MySQL.
2. The service performs an explicit cascade cleanup in MongoDB: `Task.deleteMany({ projectId, userId })`.
3. The project record is removed from MySQL: `DELETE FROM projects WHERE id = ? AND user_id = ?`.
4. This ensures no orphaned task documents remain in MongoDB.

### 4. Independent Database Reads (No Distributed Transactions)
The dashboard metrics query reads from MySQL and MongoDB asynchronously. As these are two separate database engines, this read is **not** wrapped in a 2-Phase Commit (2PC) or distributed transaction. This provides low latency, near-real-time metrics suitable for dashboard reporting without blocking locks.

---

## 12. Postman Collection Import Guide

1. Open Postman.
2. Click **Import** (top left).
3. Select `postman/choira-api.postman_collection.json` and `postman/choira-api.postman_environment.json`.
4. Select the environment **Choira API - Local Development**.
5. Run the **Register User** or **Login User** request. The test script will automatically set the `token` collection variable.
6. Run any protected endpoints (Projects, Tasks, Dashboard)—the Bearer token is automatically attached.
