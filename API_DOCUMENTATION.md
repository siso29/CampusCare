# CampusCare API Contract & Integration Guide

This document defines the REST API contract for the separately maintained Next.js frontend running at `http://localhost:3000`.

- **Base URL:** `http://localhost:3001/api/v1`
- **Swagger Interactive UI:** `http://localhost:3001/api/docs`
- **Authentication Scheme:** Secure `HttpOnly` cookie named `campuscare_session` (automatic in browsers with `credentials: 'include'`) or `Authorization: Bearer <token>` for programmatic clients.
- **CSRF Token:** Handled automatically via `campuscare_csrf` cookie or pass `X-CSRF-Token` header on state mutations.

---

## 1. Response Envelope

All API endpoints return JSON in the standardized envelope:

### Successful Response (`200`, `201`)
```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... }
}
```

### Error Response (`400`, `401`, `403`, `404`, `409`, `500`)
```json
{
  "success": false,
  "statusCode": 401,
  "timestamp": "2026-11-18T14:30:00.000Z",
  "path": "/api/v1/auth/me",
  "message": "Authentication required. Please log in.",
  "errors": [ ... ]
}
```

---

## 2. API Endpoints

### 2.1 Authentication (`/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register new student account |
| `POST` | `/auth/login` | Public | Authenticate user; sets `campuscare_session` cookie |
| `POST` | `/auth/logout` | Authenticated | Invalidate session; clears cookies |
| `GET` | `/auth/me` | Authenticated | Retrieve profile of authenticated user |
| `POST` | `/auth/change-password` | Authenticated | Update password |
| `POST` | `/auth/forgot-password`| Public | Request password reset token |
| `POST` | `/auth/reset-password` | Public | Reset password with token |
| `POST` | `/auth/verify-email` | Public | Verify student email |
| `GET` | `/auth/csrf` | Public | Obtain CSRF token |

### 2.2 Physical Hierarchy & Universities

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/universities` | Public | List active universities |
| `GET` | `/universities/:id` | Public | Get university with campuses and departments |
| `GET` | `/universities/:id/campuses`| Public | List campuses for a university |
| `GET` | `/campuses/:id/buildings` | Public | List buildings within a campus |
| `GET` | `/universities/:id/departments`| Public | List maintenance departments |
| `GET` | `/categories` | Public | List all 11 maintenance categories |

### 2.3 Maintenance Requests (`/requests`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/requests` | Student, Admin | Submit maintenance request |
| `GET` | `/requests` | Authenticated | List requests (scoped by role & tenant; pagination & filters) |
| `GET` | `/requests/:id` | Authenticated | Request details (status history, comments, attachments) |
| `PATCH` | `/requests/:id/status`| Authenticated | Transition request workflow status |
| `POST` | `/requests/:id/assign`| Admin | Manually assign staff member to request |
| `POST` | `/requests/:id/comments`| Authenticated | Add public comment or internal staff note |

#### Query Parameters for `GET /requests`:
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `status` (`SUBMITTED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, etc.)
- `priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)
- `categoryId` (UUID)
- `campusId` (UUID)
- `buildingId` (UUID)
- `search` (text search on title, description, or requestNumber)
- `sortBy` (`createdAt`, `priority`, `status`, `requestNumber`)
- `sortOrder` (`asc`, `desc`)

### 2.4 Attachments (`/attachments`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/attachments/:requestId/upload` | Authenticated | Upload image (multipart/form-data, key `file`) |
| `GET` | `/attachments/:id/download` | Authenticated | Stream private, authenticated attachment file |

### 2.5 In-App Notifications (`/notifications`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/notifications` | Authenticated | List current user's alerts & unread count |
| `PATCH` | `/notifications/:id/read` | Authenticated | Mark a single notification as read |
| `POST` | `/notifications/read-all` | Authenticated | Mark all notifications as read |
| `GET` | `/notifications/preferences` | Authenticated | Get alert preferences |
| `PATCH` | `/notifications/preferences` | Authenticated | Update alert preferences |

### 2.6 Dashboard Metrics (`/dashboard`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard/metrics` | Authenticated | Get role-tailored metrics & live breakdown |

### 2.7 User Management (`/users`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | Admin | List all university users (filtered by role) |
| `GET` | `/users/staff` | Admin, Staff | Directory of active maintenance staff |
| `PATCH` | `/users/:id/role-status` | Admin | Update user role (`STUDENT`, `STAFF`, `ADMIN`) or status |

### 2.8 System Health (`/health`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | System and PostgreSQL connectivity health probe |

---

## 3. Frontend Next.js Client Integration Example

When connecting from the Next.js frontend (`fetch` or Axios):

```typescript
// Example fetch client with credentials support
const res = await fetch('http://localhost:3001/api/v1/requests', {
  method: 'GET',
  credentials: 'include', // Automatically sends the HttpOnly session cookie
  headers: {
    'Accept': 'application/json',
  },
});
const { data, success } = await res.json();
```
