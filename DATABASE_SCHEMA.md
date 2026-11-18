# Database Schema Documentation

CampusCare uses PostgreSQL with normalized models managed by Prisma ORM. All primary keys are UUIDs.

## 1. Entity-Relationship Overview

```
[University]
  ├── [Campus]
  │     └── [Building]
  │           └── [MaintenanceRequest]
  ├── [Department]
  │     └── [MaintenanceRequest]
  └── [User]
        ├── [Session]
        ├── [EmailVerificationToken]
        ├── [PasswordResetToken]
        ├── [NotificationPreference]
        ├── [Notification]
        ├── [AuditLog]
        ├── [MaintenanceRequest] (Reporter)
        ├── [MaintenanceAssignment] (Staff / Assigner)
        ├── [MaintenanceComment] (Author)
        ├── [MaintenanceAttachment] (Uploader)
        └── [MaintenanceStatusHistory] (Actor)

[MaintenanceCategory]
  └── [MaintenanceRequest]

[SystemSetting] (Scoped to University or Global)
```

---

## 2. Model Specifications

### 2.1 University & Physical Hierarchy

#### `universities`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, default UUID | Unique tenant identifier |
| `name` | VarChar(150) | Not Null | Official university name |
| `code` | VarChar(30) | Unique, Not Null | Unique university code (e.g., `DDU`) |
| `slug` | VarChar(80) | Unique, Not Null | URL slug (e.g., `dire-dawa-university`) |
| `domain` | VarChar(100) | Not Null | Email domain (e.g., `ddu.edu.et`) |
| `logoUrl` | VarChar(255) | Nullable | Public asset URL |
| `isActive` | Boolean | Default `true` | Soft disable tenant |
| `createdAt` | Timestamptz(3)| Default `now()` | Timestamp |
| `updatedAt` | Timestamptz(3)| Auto-update | Timestamp |

#### `campuses`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Campus ID |
| `universityId` | UUID | FK -> `universities.id` (CASCADE) | Owning university |
| `name` | VarChar(120) | Not Null | e.g. "Main Campus", "IoT Campus" |
| `code` | VarChar(30) | Not Null | e.g. "MAIN", "IOT" |
| `location` | VarChar(255) | Nullable | Physical address |
| `isActive` | Boolean | Default `true` | Active status |

*Index / Constraints:* `@@unique([universityId, code])`, `@@index([universityId])`

#### `buildings`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Building ID |
| `campusId` | UUID | FK -> `campuses.id` (CASCADE) | Campus location |
| `name` | VarChar(120) | Not Null | Building name |
| `code` | VarChar(30) | Not Null | Building code (e.g., `DORM-B01`) |
| `floors` | Int | Default `1` | Number of floors |
| `type` | VarChar(60) | Nullable | `DORMITORY`, `CLASSROOM`, etc. |

*Index / Constraints:* `@@unique([campusId, code])`, `@@index([campusId])`

#### `departments`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Department ID |
| `universityId` | UUID | FK -> `universities.id` (CASCADE) | Owning university |
| `name` | VarChar(120) | Not Null | e.g., "Electrical Maintenance" |
| `code` | VarChar(30) | Not Null | e.g., `ELECTRICAL` |
| `type` | VarChar(60) | Nullable | Internal classification |

---

## 3. Users, Sessions & Auth Models

#### `users`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | User ID |
| `universityId` | UUID | FK -> `universities.id` (RESTRICT) | Tenant association |
| `departmentId` | UUID | FK -> `departments.id` (SET NULL) | Department assignment |
| `email` | VarChar(254) | Unique, Not Null | Unique login email |
| `passwordHash` | VarChar(255) | Not Null | Argon2id hash |
| `firstName` | VarChar(80) | Not Null | First name |
| `lastName` | VarChar(80) | Not Null | Last name |
| `phone` | VarChar(30) | Nullable | Contact number |
| `studentId` | VarChar(50) | Nullable | e.g. `DDU/1234/14` |
| `role` | Enum | `STUDENT`, `MAINTENANCE_STAFF`, `ADMIN` | Role |
| `status` | Enum | `PENDING_VERIFICATION`, `ACTIVE`, `SUSPENDED`, `DEACTIVATED` | Status |

*Index:* `@@index([universityId, role, status])`

#### `sessions`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Session ID |
| `tokenHash` | Char(64) | Unique, Not Null | SHA-256 hash of token |
| `userId` | UUID | FK -> `users.id` (CASCADE) | Account owner |
| `expiresAt` | Timestamptz(3)| Not Null | Expiration timestamp |
| `ipAddress` | VarChar(64) | Nullable | Client IP |
| `userAgent` | VarChar(512) | Nullable | Client User-Agent |
| `lastUsedAt` | Timestamptz(3)| Default `now()` | Last activity check |

*Index:* `@@index([userId])`, `@@index([expiresAt])`

---

## 4. Maintenance & Workflow Models

#### `maintenance_requests`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Request ID |
| `requestNumber`| VarChar(40) | Unique, Not Null | Sequential ID: `REQ-DDU-2026-0001` |
| `universityId` | UUID | FK -> `universities.id` (RESTRICT) | Tenant isolation key |
| `campusId` | UUID | FK -> `campuses.id` (RESTRICT) | Campus location |
| `buildingId` | UUID | FK -> `buildings.id` (RESTRICT) | Building location |
| `departmentId` | UUID | FK -> `departments.id` (SET NULL) | Dispatched department |
| `categoryId` | UUID | FK -> `maintenance_categories.id` (RESTRICT)| Category key |
| `reporterId` | UUID | FK -> `users.id` (RESTRICT) | Submitter account |
| `title` | VarChar(120) | Not Null | Summary title |
| `description` | Text | Not Null | Detailed description |
| `locationDetails`| VarChar(200)| Not Null | Exact room / floor / hall |
| `priority` | Enum | `LOW`, `MEDIUM`, `HIGH`, `URGENT` | Priority level |
| `status` | Enum | 11-step status enum | Workflow state |
| `resolvedAt` | Timestamptz(3)| Nullable | Work resolution timestamp |
| `closedAt` | Timestamptz(3)| Nullable | Closure timestamp |

#### `maintenance_assignments`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Assignment ID |
| `requestId` | UUID | FK -> `maintenance_requests.id` (CASCADE) | Request reference |
| `staffId` | UUID | FK -> `users.id` (RESTRICT) | Assigned staff member |
| `assignedById`| UUID | FK -> `users.id` (RESTRICT) | Admin actor |
| `status` | Enum | `ASSIGNED`, `ACKNOWLEDGED`, `IN_PROGRESS`, `COMPLETED`, `REASSIGNED` | Assignment state |
| `notes` | VarChar(1000)| Nullable | Work instructions |

#### `maintenance_status_histories`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | History ID |
| `requestId` | UUID | FK -> `maintenance_requests.id` (CASCADE) | Request reference |
| `actorId` | UUID | FK -> `users.id` (RESTRICT) | Actor who triggered transition |
| `fromStatus` | Enum (Nullable)| Initial state is `null` | Previous status |
| `toStatus` | Enum | Not Null | New status |
| `reason` | VarChar(1000)| Nullable | Justification note |
| `createdAt` | Timestamptz(3)| Default `now()` | Transition time |

#### `maintenance_comments`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Comment ID |
| `requestId` | UUID | FK -> `maintenance_requests.id` (CASCADE) | Request reference |
| `authorId` | UUID | FK -> `users.id` (RESTRICT) | Comment author |
| `message` | Text | Not Null | Comment content |
| `isInternal` | Boolean | Default `false` | Staff/Admin private note |

#### `maintenance_attachments`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Attachment ID |
| `requestId` | UUID | FK -> `maintenance_requests.id` (CASCADE) | Request reference |
| `uploaderId` | UUID | FK -> `users.id` (RESTRICT) | Uploader ID |
| `storageKey` | VarChar(255) | Unique, Not Null | Randomized UUID filename |
| `originalFilename`| VarChar(255)| Not Null | Client filename |
| `mimeType` | VarChar(100) | Not Null | Verified MIME type |
| `fileSizeBytes`| Int | Not Null | File size |

---

## 5. System, Notifications & Auditing

- **`notifications`**: User alerts with `isRead`, `readAt`, and `resourceId`.
- **`notification_preferences`**: Granular toggles per user for email and in-app updates.
- **`audit_logs`**: System compliance entries with `actorId`, `universityId`, `action`, `details` (JSON), `ipAddress`, and `userAgent`.
- **`system_settings`**: Key-value settings with optional `universityId` scoping.
