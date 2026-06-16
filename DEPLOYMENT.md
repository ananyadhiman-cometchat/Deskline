# DeskLine — Staging Deployment

Target: `deskline-cometchat-staging.com`
Architecture: **Client → ALB (TLS) → host nginx (:80) → docker containers (127.0.0.1)**

```
                       :443 TLS
client  ─────────────▶  ALB  ─────HTTP:80────▶  EC2 host nginx
                                                    │
                                ┌───────────────────┼──────────────────┐
                                ▼                                       ▼
                       127.0.0.1:8080                            127.0.0.1:4000
                       (web container,                          (backend container,
                        nginx + SPA)                             Express + Prisma)
                                                                       │
                                                                       ▼
                                                              127.0.0.1:5432
                                                              (postgres container)
```

---

## 1. Provision the server

A `t3.small` (or larger) EC2 instance is enough for staging.

```bash
# Amazon Linux 2023 / Ubuntu 22.04+
sudo dnf install -y docker nginx git    # AL2023
# or
sudo apt update && sudo apt install -y docker.io docker-compose-plugin nginx git  # Ubuntu

sudo systemctl enable --now docker nginx
sudo usermod -aG docker $USER           # log out + back in for group to apply
```

Verify Docker Compose v2 is present:

```bash
docker compose version   # expect v2.20+
```

## 2. Clone and configure

```bash
sudo mkdir -p /opt/deskline && sudo chown $USER:$USER /opt/deskline
cd /opt/deskline
git clone <repo-url> .

cp .env.production.example .env
# Paste your real secrets into .env (POSTGRES_*, JWT_*, GEMINI_API_KEY,
# FIREBASE_*, VITE_FIREBASE_*).
chmod 600 .env
```

Generate JWT secrets if you don't already have them:

```bash
openssl rand -hex 64   # JWT_ACCESS_SECRET
openssl rand -hex 64   # JWT_REFRESH_SECRET
```

## 3. Install host nginx vhost

```bash
sudo cp deploy/nginx/deskline-cometchat-staging.conf /etc/nginx/conf.d/
sudo nginx -t
sudo systemctl reload nginx
```

If the distro has a `default_server` already, drop the trailing `server { … return 444; }` block from the config or remove `/etc/nginx/conf.d/default.conf`.

## 4. Bring up the stack

```bash
cd /opt/deskline
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
docker compose -f docker-compose.prod.yml ps
```

The backend container runs `prisma migrate deploy` then a one-shot idempotent seed before starting the API. Watch the first start:

```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

Smoke test from the host:

```bash
curl -s http://127.0.0.1:4000/api/health
curl -s -H 'Host: deskline-cometchat-staging.com' http://127.0.0.1/api/health
```

Both should return `{"status":"ok","service":"DeskLine API"}`.

## 5. ALB + DNS

- **Target group**: HTTP, port `80`, health check path `/api/health`, success codes `200`.
- **Listener**: HTTPS :443 with the ACM cert for `deskline-cometchat-staging.com`, default action forward to the target group. Add an HTTP :80 listener that redirects to HTTPS.
- **Security group**: ALB allows :443 (and :80) from `0.0.0.0/0`; instance SG allows :80 only from the ALB SG.
- **DNS**: Route 53 (or your provider) A/ALIAS record `deskline-cometchat-staging.com` → ALB DNS name.

## 6. Verify end-to-end

```bash
curl -i https://deskline-cometchat-staging.com/api/health
# Expect 200 and {"status":"ok",...}

# SPA loads
curl -I https://deskline-cometchat-staging.com/
# Expect 200, Content-Type: text/html
```

Open `https://deskline-cometchat-staging.com/` in a browser, log in with a seeded user, and confirm `/api/auth/login` works in the network tab.

---

## Routine ops

**Update to a new commit**

```bash
cd /opt/deskline
git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

**Rotate JWT or other secrets**

```bash
nano .env                                # update values
docker compose -f docker-compose.prod.yml --env-file .env up -d backend
```

**Database backup**

```bash
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup-$(date +%F).sql
```

**Tail logs**

```bash
docker compose -f docker-compose.prod.yml logs -f backend
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log
```

---

## Notes / gotchas

- `VITE_API_URL` is intentionally **empty** in `.env` so the SPA makes same-origin `/api/*` requests that host nginx routes to the backend. Don't set it to the full URL unless you also want CORS to kick in.
- All Vite `VITE_*` values are **baked into the JS bundle at build time**. Changing them requires `--build` on the next deploy, not just a restart.
- Postgres data lives in the `pgdata` named volume. `docker compose down` keeps it; `docker compose down -v` deletes it.
- `set_real_ip_from` in the nginx config covers RFC1918 ranges. If your VPC uses a single narrower CIDR, replace those lines with just that CIDR for tighter security.
- Backend has `app.set('trust proxy', 'loopback, linklocal, uniquelocal')`, so `req.ip` and `req.protocol` reflect the original client behind ALB + nginx.
