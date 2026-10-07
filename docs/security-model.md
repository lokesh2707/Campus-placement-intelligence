# Security Model & Authorization Architecture

## 1. Core Principles

1. **Zero-Trust Client Authorization**: The client (Web or Mobile) is never trusted to assert permissions. All authorization checks are enforced server-side.
2. **Multi-Tenant Isolation**: Data is partitioned by `collegeId`. All queries must filter by the authenticated user's tenant context.
3. **Least Privilege**: Users are granted only the permissions required for their explicit operational role.
4. **Defense in Depth**: Defense is applied at network boundaries, middleware validation layers, ORM query scopes, and file storage sanitizers.

---

## 2. Authentication Flow & Token Lifecycle

The platform uses a dual-token JWT model:

```text
Client (Web/Mobile)                    Backend API                     Postgres (Session)
        │                                   │                                   │
        │── 1. POST /auth/login ───────────>│                                   │
        │                                   │── 2. Verify Bcrypt Hash           │
        │                                   │── 3. Persist Refresh Token ──────>│
        │<── 4. Access Token (15m) ─────────│
        │      + Refresh Token (7d)         │
        │                                   │
        │── 5. Request with Bearer Token ──>│
        │                                   │── 6. Verify Signature & Claims
        │<── 7. Resource Data ──────────────│
        │                                   │
        │   (Access Token Expires)          │
        │── 8. POST /auth/refresh ─────────>│
        │                                   │── 9. Verify Refresh Token ───────>│
        │                                   │── 10. Rotate Token Pair ─────────>│
        │<── 11. New Token Pair ────────────│
```

- **Short-Lived Access Token**: 15-minute expiration containing `userId`, `role`, `collegeId`, `departmentId`, `companyId`.
- **Long-Lived Refresh Token**: 7-day expiration, stored cryptographically hashed in the PostgreSQL `Session` table, rotated upon every refresh.
- **Revocation**: Logging out or detecting suspicious activity immediately deletes/invalidates the corresponding session record in the database.

---

## 3. Role-Based Access Control (RBAC)

The system enforces 6 distinct roles:

| Role | Scope | Permitted Operations |
|:---|:---|:---|
| `SUPER_ADMIN` | Global Platform | System settings, college provisioning, global audits. |
| `PLACEMENT_ADMIN` | College Tenant | Drives, companies, student records, offer policies, college analytics. |
| `PLACEMENT_COORDINATOR` | College Tenant | Student verification, interview scheduling, drive execution. |
| `DEPARTMENT_COORDINATOR` | Department | Read/manage students in own department, department analytics. |
| `RECRUITER` | Assigned Company | Post jobs, review applicants, stage transitions, conduct interviews. |
| `STUDENT` | Self Profile | Apply to eligible drives, view personal timeline, resume uploads, AI assistant. |

### Data Boundary Rules

- **Recruiter Isolation**: Recruiters cannot access student profiles or applications outside of drives associated with their specific `companyId`.
- **Department Coordinator Isolation**: Department coordinators can only query students whose `departmentId` matches their own.
- **Student Document Privacy**: Student resumes and transcripts can only be accessed by the student themselves, authorized placement staff, or recruiters assessing that specific candidate's application.

---

## 4. File Upload & Storage Security

Uploaded documents (resumes, certificates, offer letters) are subject to strict security protocols:

1. **MIME Type Whitelisting**: Only `application/pdf` and `application/vnd.openxmlformats-officedocument.wordprocessingml.document` are allowed for resumes.
2. **File Size Bounds**: Maximum size of 10 MB per upload.
3. **Filename Sanitization**: Original file names are stripped of dangerous characters (`..`, `/`, `\`, null bytes) and replaced with cryptographically random hex slugs (`resume_a1b2c3d4.pdf`).
4. **Path Traversal Protection**: All paths are resolved against the configured base storage directory using strict normalized path prefix verification:
   ```typescript
   if (!fullPath.startsWith(this.baseDir)) {
     throw new Error('Access denied: Invalid file path');
   }
   ```
5. **Private Serving**: Files are never served via raw public directory listings; access is routed through authenticated endpoints validating permissions.

---

## 5. Secret & Error Management

- **Password Storage**: Passwords must be hashed using `bcrypt` (work factor 12) or `argon2id`. Plaintext passwords are never logged or stored.
- **No Stack Traces in Production**: In production mode (`NODE_ENV === 'production'`), error responses return standardized error messages without leaking internal file paths or stack traces.
- **Audit Logging**: All critical administrative mutations (offer release, status change, policy override) generate immutable records in the `AuditLog` table.
