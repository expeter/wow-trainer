# Midnight Season 2 online service

This loopback-only Node service owns optional Battle.net identity and Season 2
usage statistics. It uses the built-in Node SQLite module and does not import,
stop, migrate, or deploy the inherited `/v1` application.

Required service environment:

- `MIDNIGHT_ONLINE_DATABASE=/var/lib/midnight-online/midnight.sqlite`
- `MIDNIGHT_ONLINE_ALLOWED_ORIGINS=https://midnight.asgard.website`
- `V2_BATTLE_NET_CLIENT_ID` and `V2_BATTLE_NET_CLIENT_SECRET`
- `V2_BATTLE_NET_CALLBACK_URL=https://api.asgard.website/v2/auth/battlenet/callback`
- `MIDNIGHT_ONLINE_MAINTAINER_ACCOUNT_IDS` as comma-separated Battle.net user IDs
- `MIDNIGHT_ONLINE_INTERNAL_KEY_SHA256` for feedback-session verification

Use the dedicated Midnight Season 2 Battle.net client. Its service URL is
`https://midnight.asgard.website/`; its production redirect is the callback
above. Local development may instead set
`V2_BATTLE_NET_CALLBACK_URL=http://127.0.0.1:8799/v2/auth/battlenet/callback`
and `VITE_ONLINE_API_URL=http://127.0.0.1:8799` in the ignored repository
`.env`. `npm run online:serve` loads the server values from that file when
present; Vite reads only the explicitly public `VITE_` address. Local HTTP
sessions omit the production-only `Secure` cookie attribute. Production
secrets stay in `/etc/midnight-online.env`; none are part
of the static trainer bundle. Never change the working L’ura client.

The service defaults to `127.0.0.1:8799`. Add only the path-specific Caddy
handlers from `Caddyfile.example`, leaving `/v1` and `/v2/feedback` on their
current owners.

The production unit uses an isolated Node 22 runtime at
`/opt/midnight-online/node`; it does not replace the VPS system Node used by
other services. Verify the official distribution checksum before installation.
