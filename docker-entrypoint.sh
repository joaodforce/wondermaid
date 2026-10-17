#!/bin/sh
set -e

# Apply pending Drizzle migrations before starting the app.
# Retries so the container can start alongside a database that is still booting.
if [ "${SKIP_MIGRATIONS:-false}" != "true" ]; then
  attempts="${MIGRATION_RETRIES:-5}"
  until node /app/migrate.cjs; do
    attempts=$((attempts - 1))
    if [ "$attempts" -le 0 ]; then
      echo "[entrypoint] Migrations failed, giving up" >&2
      exit 1
    fi
    echo "[entrypoint] Migrations failed, retrying in 3s ($attempts attempts left)" >&2
    sleep 3
  done
fi

exec "$@"
