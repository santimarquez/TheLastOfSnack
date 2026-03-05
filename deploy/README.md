# Blue/green deployment

Zero-downtime upgrades: two slots (blue and green). Nginx routes to the active slot; the upgrade script builds the inactive slot, switches traffic, then stops the old slot.

## First deployment (bootstrap)

From the repo root, with env vars set (e.g. in `.env` for Traefik):

```bash
# Create state so upgrade script knows current slot
echo "blue" > deploy/current-slot

# Start blue slot + nginx (prod: add -f docker-compose.prod.bg.yml and TRAEFIK_* env)
docker compose -f docker-compose.bluegreen.yml -f docker-compose.prod.bg.yml up -d nginx frontend-blue game-server-blue
```

`deploy/active/default.conf` already points to blue. If you use Traefik, ensure `inverseproxy_shared` exists and `TRAEFIK_LASTOFSNACK_URL`, `TRAEFIK_STACK_ENV`, etc. are set.

## Upgrade (zero downtime)

From the repo root (make the script executable once: `chmod +x deploy/upgrade.sh`):

```bash
./deploy/upgrade.sh
```

The script will:

1. Build new images
2. Start the inactive slot (green if current is blue, or blue if current is green)
3. Wait for the new slot to be healthy
4. Reload nginx to point to the new slot
5. Stop the old slot
6. Update `deploy/current-slot`

For production, set `TRAEFIK_LASTOFSNACK_URL` (and other `TRAEFIK_*` vars) so the script adds `-f docker-compose.prod.bg.yml` automatically.

## Files

- `docker-compose.bluegreen.yml` – blue/green stack (frontend-blue/green, game-server-blue/green, nginx)
- `docker-compose.prod.bg.yml` – production override (Traefik labels on nginx)
- `deploy/nginx-blue.conf`, `deploy/nginx-green.conf` – nginx configs per slot
- `deploy/active/default.conf` – active config (overwritten by upgrade script)
- `deploy/current-slot` – current active slot (`blue` or `green`)
- `deploy/upgrade.sh` – upgrade script
