# Security hardening audit

## Scope

P7.2 audit covers ownership, roles, and rate limits across gateway-facing services.

## Changes shipped

- Auth sensitive routes now have route-level rate limits:
  - `POST /auth/register`: 5/minute
  - `POST /auth/login`: 10/minute
  - `POST /auth/verify-email`: 8/minute
  - `POST /auth/resend-otp`: 3/minute
- `RateLimitGuard` exported from `@campus-connect/common` for route-level use.
- `POST /reports` now requires `JwtAuthGuard` + `VerifiedUserGuard`.
- `POST /reports` uses token subject as `reporterId`; request body `reporterId` no longer controls identity.
- `GET /reputation/me` now requires JWT and only returns token user reputation.
- `POST /reputation/:userId/award` and `POST /reputation/:userId/badge` now require `ADMIN` role.
- Admin report moderation now writes `AuditLog` records for report status updates and moderator deletes.

## Audit checklist

- Token identity preferred over body/query user IDs for writes.
- Admin-only actions guarded by `JwtAuthGuard` + `RolesGuard` + `@Roles('ADMIN')`.
- User-generated report submission requires verified account.
- Brute-force-prone auth routes rate-limited.
- Irreversible moderation actions logged to `audit_logs`.

## Follow-up candidates

- Remove legacy `userId` body/query fallbacks after older clients are gone.
- Add per-user rate limit keys for authenticated write-heavy routes.
- Add integration smoke tests for admin-only reputation award and report submission auth.
