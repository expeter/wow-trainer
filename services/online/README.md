# Midnight Season 2 online service

This loopback-only Node service owns optional Battle.net identity and Season 2
usage statistics. It uses the built-in Node SQLite module and does not import,
stop, migrate, or deploy the inherited `/v1` application.

Required environment:

- `MIDNIGHT_ONLINE_DATABASE=/var/lib/midnight-online/midnight.sqlite`
- `MIDNIGHT_ONLINE_ALLOWED_ORIGINS=https://midnight.asgard.website`
- `MIDNIGHT_BATTLENET_CLIENT_ID` and `MIDNIGHT_BATTLENET_CLIENT_SECRET`
- `MIDNIGHT_BATTLENET_CALLBACK_URL=https://api.asgard.website/v2/auth/battlenet/callback`
- `MIDNIGHT_ONLINE_MAINTAINER_ACCOUNT_IDS` as comma-separated Battle.net user IDs
- `MIDNIGHT_ONLINE_INTERNAL_KEY_SHA256` for feedback-session verification

Reuse the existing Battle.net client and add the callback URL above in its
developer configuration. Secrets stay in `/etc/midnight-online.env`; none are
part of the static trainer bundle.

The service defaults to `127.0.0.1:8799`. Add only the path-specific Caddy
handlers from `Caddyfile.example`, leaving `/v1` and `/v2/feedback` on their
current owners.
