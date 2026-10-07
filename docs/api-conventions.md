# API Conventions & Specifications

## 1. Overview & Base URL

All endpoints conform to strict RESTful principles, utilize JSON payloads, and enforce API versioning.

- **Base URL Prefix**: `/api/v1`
- **Content-Type**: `application/json` (except multi-part file uploads)
- **Time Representation**: All timestamps are formatted in ISO-8601 UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`).

---

## 2. Standard Response Structure

Every API response follows a consistent envelope contract.

### 2.1 Success Response (`ApiResponse<T>`)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resource retrieved successfully",
  "data": { ... },
  "timestamp": "2026-10-07T12:00:00.000Z"
}
```

### 2.2 Paginated Success Response (`PaginatedResponse<T>`)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Items listed successfully",
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 154,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "timestamp": "2026-10-07T12:00:00.000Z"
}
```

### 2.3 Error Response (`ApiErrorResponse`)

```json
{
  "success": false,
  "statusCode": 400,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address",
        "code": "invalid_string"
      }
    ]
  },
  "timestamp": "2026-10-07T12:00:00.000Z"
}
```

---

## 3. Standard HTTP Status Codes

| Status Code | Code Constant | Scenario |
|:---|:---|:---|
| `200 OK` | `SUCCESS` | Request succeeded; response contains requested data. |
| `201 Created` | `CREATED` | Resource was successfully created. |
| `204 No Content`| `NO_CONTENT` | Action succeeded with no body returned (e.g., deletion). |
| `400 Bad Request`| `VALIDATION_ERROR` | Schema validation failed or malformed syntax. |
| `401 Unauthorized`| `UNAUTHORIZED` | Authentication token missing, expired, or invalid. |
| `403 Forbidden` | `FORBIDDEN` | Authenticated user lacks required role/permission. |
| `404 Not Found` | `NOT_FOUND` | Resource could not be located. |
| `409 Conflict` | `CONFLICT` | Resource already exists or concurrent update conflict. |
| `429 Too Many Requests`| `RATE_LIMITED` | Rate limit exceeded. |
| `500 Internal Error`| `INTERNAL_SERVER_ERROR` | Server-side unhandled exception (never leaks stack traces in production). |

---

## 4. Query Parameter Standards

All list endpoints adhere to uniform pagination, sorting, and filter standards:

- `page`: 1-based index (default: `1`).
- `limit`: Number of items per page (default: `20`, max: `100`).
- `sortBy`: Field to sort by (e.g., `createdAt`, `cgpa`, `driveDate`).
- `sortOrder`: `asc` or `desc` (default: `desc`).
- `search`: Keyword string for fuzzy or prefix matching.

Example:
```text
GET /api/v1/drives?page=1&limit=20&sortBy=driveDate&sortOrder=asc&search=Google
```

---

## 5. Input Validation Architecture

All input validation occurs at the middleware layer using **Zod** before reaching controller logic:

```typescript
router.post(
  '/drives',
  authenticate,
  requireRoles(UserRole.PLACEMENT_ADMIN, UserRole.PLACEMENT_COORDINATOR),
  validateBody(createDriveSchema),
  driveController.create
);
```

---

## 6. Realtime Events (Socket.IO)

Socket connections authenticate via JWT in handshake headers:

- **Namespaces**: Default `/`
- **Rooms**:
  - `user:{userId}`: For direct notifications (interview scheduled, offer received).
  - `college:{collegeId}`: For college-wide broadcasts (new placement drive announcement).
  - `drive:{driveId}`: For live stage progression alerts.
