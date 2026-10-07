# File Storage Architecture

## 1. Storage Abstraction Pattern

The platform handles resumes, offer letters, student certificates, and company logos without requiring paid cloud object storage (such as AWS S3 or Google Cloud Storage).

```text
                     ┌───────────────────────┐
                     │    IStorageService    │
                     │       Interface       │
                     └───────────┬───────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
                 ▼                               ▼
      ┌───────────────────────┐       ┌───────────────────────┐
      │ LocalStorageProvider  │       │ CloudStorageProvider  │
      │  (Default: Local Disk)│       │  (Optional: S3/MinIO) │
      └───────────────────────┘       └───────────────────────┘
```

---

## 2. Local Storage Provider (`LocalStorageProvider`)

- **Default Setting**: `STORAGE_PROVIDER="local"`
- **Path**: Configured via `LOCAL_STORAGE_PATH` (defaults to `./uploads`).
- **Features**:
  - Automatically creates directory hierarchies (`resumes/`, `certificates/`, `logos/`, `offers/`).
  - Sanitizes user filenames into cryptographic non-colliding identifiers:
    `${safeName}_${cryptoRandomHex(8)}.${extension}`.
  - Enforces strict path normalization and prefix checks to defeat Directory Traversal (`../`) attacks.
  - Exposes streaming APIs (`getStream(fileKey)`) for efficient memory-bounded file downloads.

---

## 3. Optional Cloud Storage (`CloudStorageProvider`)

- Designed as a drop-in adapter implementing the exact same `IStorageService` interface.
- Can be activated in enterprise deployments with self-hosted open-source MinIO or AWS S3 by changing the configuration flag `STORAGE_PROVIDER="cloud"`.
- Zero application code changes are required when switching providers.

---

## 4. Metadata Persistence

File records are tracked in PostgreSQL via the `StorageRecord` model:
- `fileKey`: Unique logical storage key (e.g., `resumes/resume_a8f9c1.pdf`).
- `originalFilename`: Name provided during upload for user-facing displays.
- `mimeType`: Verified content type.
- `sizeBytes`: Size in bytes.
- `storageProvider`: Provider tag (`local` or `cloud`).
- `uploadedBy`: User identifier of the uploader.
