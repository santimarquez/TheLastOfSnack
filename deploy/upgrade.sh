#!/usr/bin/env bash
# Blue/green upgrade: build new slot, switch nginx to it, stop old slot. Zero-downtime.
# Run from repo root: ./deploy/upgrade.sh
# For prod (Traefik): set TRAEFIK_* env vars and use -f docker-compose.prod.bg.yml (script auto-adds if TRAEFIK_LASTOFSNACK_URL is set).

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

COMPOSE_OPTS="-f docker-compose.bluegreen.yml"
if [ -n "${TRAEFIK_LASTOFSNACK_URL:-}" ] && [ -f docker-compose.prod.bg.yml ]; then
  COMPOSE_OPTS="$COMPOSE_OPTS -f docker-compose.prod.bg.yml"
fi

STATE_FILE="deploy/current-slot"
if [ -f "$STATE_FILE" ]; then
  CURRENT=$(cat "$STATE_FILE")
else
  CURRENT="blue"
  echo "blue" > "$STATE_FILE"
fi

if [ "$CURRENT" = "blue" ]; then
  NEXT="green"
else
  NEXT="blue"
fi

echo "Current slot: $CURRENT → upgrading to: $NEXT"

# 1) Build images (shared by both slots)
echo "Building images..."
docker compose $COMPOSE_OPTS build --no-cache frontend-${NEXT} game-server-${NEXT}

# 2) Start the next slot (new version)
echo "Starting $NEXT slot..."
docker compose $COMPOSE_OPTS up -d --force-recreate frontend-${NEXT} game-server-${NEXT}

# 3) Wait for app to be ready (game-server health; node:alpine has no wget/curl)
echo "Waiting for $NEXT to be healthy..."
sleep 10
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if docker compose $COMPOSE_OPTS exec -T game-server-${NEXT} node -e "
    require('http').get('http://127.0.0.1:4000/health', r => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => process.exit(d.includes('ok') ? 0 : 1));
    }).on('error', () => process.exit(1));
  " 2>/dev/null; then
    echo "$NEXT is healthy."
    break
  fi
  if [ $i -eq 15 ]; then
    echo "Health check failed for $NEXT (game-server not responding on 127.0.0.1:4000). Last 20 lines of game-server log:"
    docker compose $COMPOSE_OPTS logs --tail=20 game-server-${NEXT} 2>/dev/null || true
    exit 1
  fi
  sleep 2
done

# 4) Point nginx at the new slot
echo "Switching nginx to $NEXT..."
cp "deploy/nginx-${NEXT}.conf" "deploy/active/default.conf"
docker compose $COMPOSE_OPTS exec -T nginx nginx -s reload

# 5) Stop the old slot
echo "Stopping $CURRENT slot..."
docker compose $COMPOSE_OPTS stop frontend-${CURRENT} game-server-${CURRENT}

# 6) Persist current slot
echo "$NEXT" > "$STATE_FILE"
echo "Upgrade done. Active slot is now: $NEXT"
