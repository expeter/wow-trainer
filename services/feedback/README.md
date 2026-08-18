# Guild feedback service

`FR-098` is a narrow, zero-dependency Node service for the current playtesting
cycle. It is not the deferred identity, statistics, achievement, ranking, or
leaderboard API.

## Contract

- `POST /v2/feedback` accepts a message and zero to four PNG, JPEG, or WebP
  screenshots from an allowed trainer origin. Each screenshot is limited to
  5 MiB and retained byte-for-byte after type/signature validation.
- A shared guild code authorizes submission. Only its SHA-256 digest exists in
  the service environment; the browser bundle contains no credential.
- `GET /v2/admin/feedback` and attachment routes require a separate read-only
  Bearer download key. Reports have no public read route.
- Reports live in `/var/lib/midnight-feedback/reports`, outside both Caddy's
  document roots and the application checkout. The systemd unit creates the
  private state directory and runs with a dynamic unprivileged user.
- Caddy sends only the feedback paths to loopback port `8798`. Every other
  `api.asgard.website` request continues to the unchanged legacy service on
  `8787`.

The service limits a source address to six submission attempts per hour,
requires the exact production or configured development origin, caps request
and field sizes, validates image magic bytes, generates server-owned IDs and
filenames, and writes a report through a private staging directory. This is
intake protection, not screenshot sanitization: supplied image content and
metadata are intentionally not transformed during this guild-only cycle.

## Local operation

Set SHA-256 hex digests for `MIDNIGHT_FEEDBACK_GUILD_CODE_SHA256` and
`MIDNIGHT_FEEDBACK_DOWNLOAD_KEY_SHA256`, then run `npm run feedback:serve`.
The optional variables are:

- `MIDNIGHT_FEEDBACK_HOST` (default `127.0.0.1`)
- `MIDNIGHT_FEEDBACK_PORT` (default `8798`)
- `MIDNIGHT_FEEDBACK_STORAGE`
- `MIDNIGHT_FEEDBACK_ALLOWED_ORIGINS` (comma-separated exact origins)

Run `npm run test:feedback` for the API contract. The test uses an ephemeral
loopback port and a temporary private directory.

## Pull and triage

The VPS keeps the plaintext credentials in a root-readable credential file;
they are never committed. Copy that file into ignored `.tmp/`, then download
new reports:

```bash
MIDNIGHT_FEEDBACK_DOWNLOAD_KEY_FILE=.tmp/midnight-feedback-download-key \
  npm run feedback:pull
```

The key file contains only the download token. New reports land under
`.tmp/player-feedback/<FEEDBACK-ID>/` as `report.md` plus verified screenshots.
Existing IDs are skipped, and attachment length/SHA-256 must match the server
manifest. Manually assign an `FR`, `CR`, or `BUG` in `docs/README.md` before
implementation; raw guild reports remain ignored evidence rather than tracked
instructions.

Credential rotation means generating a new guild code and/or download token,
updating their digests in `/etc/midnight-feedback.env`, restarting only
`midnight-feedback.service`, and distributing the new guild code. Future
Battle.net authorization can replace the shared-code check without changing
the stored report or download contract.
