# Frontend deployment

This runbook deploys the static Vite SPA to the Debian 13 GCP VM at
`8.231.70.214`. The repository lives at `/srv/apps/Sapiensfrontend`, and Nginx
serves `/srv/apps/Sapiensfrontend/dist` directly. There is no frontend Node
runtime or systemd service.

## Prerequisites

- DNS: `awareai.in` has an A record for `8.231.70.214`; `www.awareai.in` is a
  CNAME to `awareai.in`.
- Only TCP ports 80 and 443 are public. Do not expose Vite or backend ports.
- Git, Node.js with Corepack, Nginx, Certbot, and its Nginx plugin are installed.
- The backend remains bound to `127.0.0.1:8000` and is healthy at
  `https://api.awareai.in`. Production frontend builds call
  `https://api.awareai.in/api` through the committed `.env.production`.
- Backend CORS already permits `https://awareai.in` and
  `https://www.awareai.in`.

The existing API certificate covers only `api.awareai.in`. Obtain a separate
certificate covering both `awareai.in` and `www.awareai.in` as described below.

## First checkout and build

Clone once using the repository's actual Git URL:

```sh
sudo mkdir -p /srv/apps
sudo chown "$USER":"$USER" /srv/apps
git clone <repository-url> /srv/apps/Sapiensfrontend
cd /srv/apps/Sapiensfrontend
corepack enable
corepack prepare pnpm@11.19.0 --activate
pnpm install --frozen-lockfile
pnpm build
```

The package manager and version come from `package.json`, and the committed
`pnpm-lock.yaml` makes `pnpm install --frozen-lockfile` reproducible. A successful
build creates `/srv/apps/Sapiensfrontend/dist/index.html` and its static assets.

## Nginx HTTP configuration

Create `/etc/nginx/sites-available/awareai.in` with exactly this initial HTTP
configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name awareai.in www.awareai.in;

    root /srv/apps/Sapiensfrontend/dist;
    index index.html;
    client_max_body_size 1G;

    location ~* \.(?:css|js|mjs|map|ico|png|jpg|jpeg|gif|svg|webp|avif|woff|woff2|ttf|otf)$ {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site and validate Nginx:

```sh
sudo ln -s /etc/nginx/sites-available/awareai.in /etc/nginx/sites-enabled/awareai.in
sudo nginx -t
sudo systemctl reload nginx
```

If that symlink already exists, do not recreate it. Remove or disable any other
enabled server block that claims `awareai.in` or `www.awareai.in`, then validate
again.

## TLS and HTTP redirect

After HTTP works for both hostnames, let Certbot add TLS and redirect HTTP to
HTTPS:

```sh
sudo certbot --nginx -d awareai.in -d www.awareai.in --redirect
sudo nginx -t
sudo systemctl reload nginx
sudo certbot renew --dry-run
```

## Verification

```sh
test -f /srv/apps/Sapiensfrontend/dist/index.html
curl -I http://awareai.in
curl -I http://www.awareai.in
curl -I https://awareai.in
curl -I https://www.awareai.in
curl -fsS https://api.awareai.in/api/orchestrator/status
sudo nginx -t
```

The HTTP frontend requests should redirect to HTTPS. Both HTTPS hostnames should
return the SPA, including a client-side route such as
`curl -I https://awareai.in/workspace`. Browser developer tools should show API
requests going to `https://api.awareai.in/api`, never localhost or port 8000.

## Deploying an update

Use fast-forward-only pulls and record the currently deployed commit before the
update:

```sh
cd /srv/apps/Sapiensfrontend
git status --short
git rev-parse HEAD
git pull --ff-only
corepack prepare pnpm@11.19.0 --activate
pnpm install --frozen-lockfile
pnpm build
sudo nginx -t
sudo systemctl reload nginx
```

`git status --short` must be empty before pulling. Because Nginx serves `dist`
directly, the new build becomes live when `pnpm build` completes; no application
service restart is required.

## Rollback

Use the commit recorded before deployment, rebuild, and reload Nginx:

```sh
cd /srv/apps/Sapiensfrontend
git switch --detach <previous-commit>
pnpm install --frozen-lockfile
pnpm build
sudo nginx -t
sudo systemctl reload nginx
```

After the issue is resolved, return to the deployment branch (replace `main` if
the repository uses another branch) with `git switch main` and deploy normally.
