# Authentication & Session Architecture

## 1. Unified Authentication Architecture

Both the **Web Application** (Next.js) and the **Mobile Application** (React Native / Expo) communicate with the exact same Node.js authentication endpoints.

```text
Web Client (Browser)           Mobile Client (Expo)
        │                               │
        └───────────────┬───────────────┘
                        │
                        ▼
             POST /api/v1/auth/login
                        │
                        ▼
             Node.js Central Backend API
                        │
           ┌────────────┴────────────┐
           ▼                         ▼
   bcrypt.compare()          Issue Dual Tokens
   (Password verification)   • Access Token (15m, signed)
                             • Refresh Token (7d, DB session)
```

---

## 2. Token Specifications

### 2.1 Access Token
- **Format**: Signed JWT (`HS256` or `RS256`).
- **Expiry**: 15 minutes.
- **Claims**:
  ```json
  {
    "userId": "d748f2c2-841f-48d6-953e-b816fb8e1345",
    "email": "alex.student@campus.edu",
    "role": "STUDENT",
    "collegeId": "c1a2b3c4-0000-0000-0000-000000000000",
    "departmentId": "d1a2b3c4-0000-0000-0000-000000000000"
  }
  ```
- **Transmission**: Sent in standard `Authorization: Bearer <token>` HTTP header.

### 2.2 Refresh Token
- **Format**: Cryptographically random 256-bit token string.
- **Expiry**: 7 days.
- **Persistence**: Persisted in PostgreSQL `Session` table linked to user, user agent, IP address, and expiry timestamp.
- **Rotation**: On every invocation of `POST /api/v1/auth/refresh`, the old refresh token is destroyed and a new pair is issued (Refresh Token Rotation).

---

## 3. Client Storage Standards

- **Web Application**: Stored in HTTP-only, secure, same-site cookies to eliminate XSS token theft.
- **Mobile Application**: Stored in device hardware-backed secure storage via `expo-secure-store` or equivalent platform Keychain/Keystore.

---

## 4. Multi-Role Authorization Enforcement

Every secured endpoint passes through two sequential middleware gates:
1. `authenticate`: Verifies signature and expiration of JWT Bearer token, populates `req.user`.
2. `requireRoles(...roles)`: Verifies `req.user.role` belongs to the list of authorized roles for that endpoint.
