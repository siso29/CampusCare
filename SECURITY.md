# Security Baseline & Threat Mitigation

CampusCare implements defence-in-depth architecture adhering to OWASP API Security Top 10 recommendations.

---

## 1. Authentication & Credential Storage

1. **Password Hashing:**
   - Evaluated using **Argon2id** (the winner of the Password Hashing Competition) with parameters:
     - Memory Cost: 19 MiB (`19456` KiB)
     - Time Cost: `2` iterations
     - Parallelism: `1` thread
   - Passwords and raw hashes are never exposed in logs, API responses, or error payloads.
2. **Session Architecture:**
   - Cryptographically random 64-character hex tokens generated via Node.js `crypto.randomBytes(32)`.
   - The server stores only the **SHA-256 hash** of the session token.
   - Sessions are bound to `expiresAt`, client `ipAddress`, and `userAgent`.
   - Sliding session validation checks status and updates `lastUsedAt`.
   - Logging out or changing passwords invalidates active sessions in database transactions.

---

## 2. Multi-Tenancy & Authorization Controls

1. **Broken Object Level Authorization (BOLA / IDOR):**
   - Students can only view, comment on, and close their own requests (`reporterId === user.id`).
   - Maintenance staff can only inspect requests in their university or department.
   - Campus and building relationships are validated to ensure they belong to the user's university before creation.
2. **Broken Function Level Authorization:**
   - Enforced by server-side `RolesGuard`.
   - Only `ADMIN` can assign staff members or adjust user account statuses.
   - Students cannot self-elevate roles or assign work.
3. **Internal Data Leaks:**
   - Staff-to-staff internal comments (`isInternal = true`) are strictly filtered out before returning responses to students.

---

## 3. Web & Network Defenses

1. **Cross-Site Scripting (XSS) & Header Security:**
   - `Helmet` sets strict HTTP headers:
     - `Content-Security-Policy`
     - `X-Frame-Options: DENY` (prevents clickjacking)
     - `X-Content-Type-Options: nosniff`
     - `Strict-Transport-Security` (HSTS)
2. **Cross-Site Request Forgery (CSRF):**
   - Cookie `SameSite` set to `Lax` (or `Strict`).
   - Browser modern `Sec-Fetch-Site: cross-site` requests are automatically rejected.
   - Dual-token cookie verification on state-changing requests.
3. **Cross-Origin Resource Sharing (CORS):**
   - Explicit origin whitelist configured via `CORS_ORIGINS`.
   - Wildcards (`*`) are disallowed when `credentials: true`.
4. **Denial of Service (DoS) & Rate Limiting:**
   - `@nestjs/throttler` configured globally (120 requests/minute per IP).
   - Strict payload size limits on JSON bodies and multipart uploads (5 MB max).

---

## 4. File Upload Hardening

1. **Private Storage:** Attachments are stored outside the public document root in an unlisted `uploads/` directory.
2. **Filename Randomization:** Original filenames are discarded for disk storage; files are named using cryptographically random UUIDs (e.g. `123e4567-e89b-12d3-a456-426614174000.jpg`).
3. **Content Signature (Magic Byte) Inspection:** The server inspects the first 4 bytes of uploaded files to ensure image signatures match claimed MIME types (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG, `52 49 46 46` for WEBP), preventing extension-spoofing attacks.
4. **Access Control:** File downloads pass through `GET /api/v1/attachments/:id/download`, requiring valid authentication and tenant verification before streaming bytes.
