# API v2 and public statistics

## Boundary

Season 2 uses `https://api.asgard.website/v2`. It does not reinterpret `/v1`
attempts, achievements, scores, duties, or leaderboard seasons.

The preferred long-term deployment is one API application mounting frozen v1
routes and isolated v2 modules. That avoids two processes competing over auth,
SQLite migrations, sessions, or deployment ownership. The new repository may
take over deployment only after it contains the v1 code unchanged and passes a
compatibility suite against a restored production-shaped database.

Until that migration milestone, the old repository remains the only API
deployment owner and the Season 2 client uses a no-op/local reporter.

## Stable identifiers reserved by the client

Every local attempt report should already be able to supply:

- `trainerId`: `midnight-season-2`.
- `seasonId`: `midnight-s2`.
- `encounterId`.
- `modeId`: `learn2d` or `train3d`.
- `scenarioId` and scenario kind: drill or full fight.
- `difficulty`.
- `timingProfileId`.
- `tacticId` or `custom` without custom plan content.
- `roleId` and controlled roster slot where relevant.
- Deterministic seed.
- Start/end timestamps, active duration, and result.
- Stable failure reason codes and numeric metrics.
- Client version, build revision, and attempt-schema version.

Adding these locally does not authorize network submission.

## Initial v2 routes

### `POST /v2/attempts`

Starts an anonymous or authenticated attempt and returns an opaque attempt ID,
one-use reporting capability, server start time and expiry. The server
validates catalogue IDs, build compatibility and request rate.

### `POST /v2/attempts/{attemptId}/heartbeat`

Optional, coarse activity update used to distinguish a started lesson from a
long active session. It must be low frequency and idempotent. Browser unload is
not reliable, so absence of a completion is reported as an incomplete attempt,
not definitely as a deliberate abandonment.

### `POST /v2/attempts/{attemptId}/complete`

Consumes the reporting capability with one of:

- `success`.
- `failure` with a stable reason code.
- `exit` when the client explicitly leaves.

Completion is idempotent and rejects changes to issued encounter, mode,
scenario, difficulty, timing profile, tactic category, role, build, or seed.
Detailed positional traces are not part of the first API.

### `GET /v2/statistics/summary`

Returns public aggregate totals and recent time buckets across the trainer.

### `GET /v2/statistics/encounters/{encounterId}`

Returns per-mode, scenario, difficulty, role and timing-profile aggregates for
one boss, subject to privacy suppression.

Reserve `/v2/me`, `/v2/achievements`, and `/v2/leaderboards`; do not publish
placeholder contracts until the progression milestone is designed.

## Public metrics

- Started, completed, successful, failed, explicitly exited, and expired
  attempts.
- Completion and success rates with clear denominators.
- Learn 2D versus Train 3D usage.
- Boss, scenario, difficulty, role and timing-profile breakdown.
- Median and percentile active duration where the sample is sufficient.
- Stable failure-category frequency.
- Daily/weekly usage without exposing event rows.
- Authenticated unique accounts when identity is later enabled.
- Anonymous session/device estimates labelled accurately; never call them
  exact unique players.

Public pages must explain whether a number counts attempts, sessions, anonymous
devices, or authenticated accounts.

## Data and privacy

Use isolated v2 tables/migrations for attempts, heartbeats, outcomes and
aggregates. Reuse account identity later through explicit foreign keys or a
stable account subject, not by making v2 understand v1 result payloads.

Do not store or publish:

- Custom tactic JSON or exact player coordinates.
- Raw movement traces.
- Player names in anonymous telemetry.
- IP addresses or full user-agent values as durable analytics fields.
- Public rows that allow an individual’s attempt history to be reconstructed.

Use rate limits, short-lived attempt capabilities, idempotency, payload size
limits, stable allowlists, and aggregate suppression below a minimum cohort.
Any operational anti-abuse IP processing must be transient and documented.

## Origin and authentication migration

- Allow only the legacy trainer origin, the Season 2 trainer origin, and
  explicit loopback development origins.
- Bind OAuth return state to an approved originating trainer rather than one
  global hard-coded `TRAINER_ORIGIN`.
- Preserve the existing Battle.net account and selected-character model when
  authentication is added to v2.
- Never silently downgrade an authenticated v2 attempt to anonymous.
- Keep Season 1 and Season 2 achievements/results separately scoped.

## Deferred progression

Points and achievements will consume accepted v2 attempt summaries after the
encounter model is stable. Achievement IDs should be season/encounter scoped,
and full-fight versus drill eligibility must be explicit. No SemVer release or
API migration implicitly creates or changes a leaderboard season.

## API migration gate

Before the new repository can deploy the shared API:

- Restore a production-shaped backup into an isolated test database.
- Apply migrations and prove v1 reads/writes remain compatible.
- Run every v1 API test unchanged plus v2 tests.
- Verify v1 health/version behavior, auth callbacks, privacy, activity,
  leaderboards, profiles, achievements, account deletion and backups.
- Ensure only one GitHub workflow has production deployment authority.
- Rehearse rollback without downgrading an already-migrated database.
