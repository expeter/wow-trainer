#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
export PLAYWRIGHT_BROWSERS_PATH="${repository_root}/.tmp/ms-playwright"

cd -- "${repository_root}"
if command -v sec-helper >/dev/null 2>&1; then
  sec-helper audit
elif [[ "${CI:-}" != "true" ]]; then
  printf 'sec-helper is required outside the locked GitHub Actions install.\n' >&2
  exit 1
fi
exec npm run test:e2e -- "$@"
