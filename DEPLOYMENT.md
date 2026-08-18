# AwareAI frontend server and deployment runbook

This document records the confirmed production server layout and the operating
procedure for the Sapiens/AwareAI Vite frontend. Keep it updated whenever the VM,
DNS, package manager, paths, or deployment procedure changes. Do not put SSH keys,
API keys, passwords, tokens, or other secrets in this file.

## Production summary

| Item | Production value |
| --- | --- |
| Cloud host | GCP VM, Debian 13 |
| Static public IP | `8.231.70.214` |
| Frontend domains | `https://awareai.in`, `https://www.awareai.in` |
| Frontend Git remote | `https://github.com/manmohan3108/Sapiensfrontend.git` |
| Frontend repository | `/srv/apps/Sapiensfrontend` |
| Static document root | `/srv/apps/Sapiensfrontend/dist` |
| Backend process | `127.0.0.1:8000` (not public) |
| Public backend | `https://api.awareai.in` |
| Frontend API base | `https://api.awareai.in/api` |
| Web server | Nginx |
| TLS manager | Certbot |
| Frontend runtime service | None; Nginx serves static files directly |
| Public firewall ports | TCP 80 and 443 only |

DNS is configured as follows:

- `awareai.in`: A record to `8.231.70.214`.
- `www.awareai.in`: CNAME to `awareai.in`.
- `api.awareai.in`: existing backend hostname on the same infrastructure.

The backend CORS configuration permits `https://awareai.in` and
`https://www.awareai.in`.

## Disk layout and placement rules

The VM has two separate filesystems. Always check the mount before moving or
creating large application data.

| Filesystem | Approximate size | Mount | Purpose |
| --- | ---: | --- | --- |
| `/dev/sdb1` | 10 GB (`9.7G`) | `/` | Debian and system packages |
| `/dev/sda` | 100 GB (`98G`) | `/srv` | Repositories, dependencies, builds, caches, releases |

Confirmed during deployment, `/` had roughly 3.8 GB free and `/srv` roughly
73 GB free. These values change; use `df` rather than relying on these figures.

Appropriate locations on the 10 GB root filesystem:

- APT-installed Git, Node.js/npm, Nginx, and Certbot.
- Nginx configuration under `/etc/nginx`.
- Certbot configuration and certificates under `/etc/letsencrypt`.
- Small system logs and service metadata.

Required locations on the 100 GB `/srv` filesystem:

- Repository: `/srv/apps/Sapiensfrontend`.
- Dependencies: `/srv/apps/Sapiensfrontend/node_modules`.
- Vite output: `/srv/apps/Sapiensfrontend/dist`.
- pnpm content-addressable store: `/srv/pnpm-store/v11`.
- Any optional future release archives: `/srv/releases/Sapiensfrontend`.

Verify placement and capacity:

```sh
df -h / /srv
findmnt /srv
df -h /srv/apps/Sapiensfrontend /srv/pnpm-store
du -sh /srv/apps/Sapiensfrontend/node_modules 2>/dev/null || true
du -sh /srv/apps/Sapiensfrontend/dist 2>/dev/null || true
du -sh /srv/pnpm-store 2>/dev/null || true
```

Do not put `node_modules`, the pnpm store, release copies, or build archives in
`/root`, `/home`, `/var`, or another path on the 10 GB root filesystem.

## Installed frontend toolchain

The confirmed production toolchain is:

- Node.js `v22.23.2`, installed as the NodeSource `nodejs` APT package.
- npm `10.9.8`.
- pnpm `11.19.0`, installed directly at `/usr/local/bin/pnpm`.
- pnpm store supplied explicitly as `/srv/pnpm-store` during installs.

pnpm 11.19.0 requires Node.js 22.13 or newer. The original Debian Node 20 build
was incompatible. An old Corepack wrapper also failed on this VM, so deployments
use the working `/usr/local/bin/pnpm` directly. Do not run `pnpm setup` or change
the pinned pnpm version just because an update notice appears.

Check the active tools:

```sh
type -a node npm pnpm corepack
node --version
npm --version
pnpm --version
apt-cache policy nodejs
```

Expected active versions are Node 22.13+ and pnpm 11.19.0.

## Repository configuration relevant to deployment

- `.env.production` contains the non-secret public setting
  `VITE_API_BASE_URL=https://api.awareai.in/api`.
- `package.json` pins `pnpm@11.19.0` using `packageManager`.
- `pnpm-lock.yaml` provides reproducible dependency resolution.
- `pnpm-workspace.yaml` permits build scripts only for the required native build
  packages:

```yaml
allowBuilds:
  '@tailwindcss/oxide': true
  esbuild: true
```

Never place secrets in a `VITE_*` variable. Vite embeds these values into the
public browser bundle.

## First clone

The production clone already exists. These commands are only for reconstructing
the VM or creating a replacement server:

```sh
sudo mkdir -p /srv/apps /srv/pnpm-store
sudo chown "$USER":"$USER" /srv/apps /srv/pnpm-store
git clone https://github.com/manmohan3108/Sapiensfrontend.git /srv/apps/Sapiensfrontend
```

The repository is public, so cloning does not require GitHub authentication.
Public access does not grant push access; only authorized GitHub accounts can
push.

## Reproducible production build

Run from the repository root:

```sh
cd /srv/apps/Sapiensfrontend
git status --short
pnpm install --frozen-lockfile --store-dir /srv/pnpm-store
pnpm build
test -f dist/index.html && echo "Frontend build succeeded"
```

There must be no tracked source/configuration modifications before deployment.
Until the repository has a `.gitignore`, generated `node_modules/` and `dist/`
may appear as untracked entries in `git status`. The Vite build writes
`dist/index.html` and content-hashed assets under `dist/assets`. A Vite warning
about JavaScript chunks larger than 500 kB is a performance warning, not a failed
build.

Verify the production API setting and reject localhost URLs:

```sh
grep -R -o "https://api.awareai.in/api" dist/assets | head
if grep -R "localhost:8000" dist/assets; then
  echo "ERROR: production bundle contains localhost"
  exit 1
else
  echo "Production bundle contains no localhost API URL"
fi
```

## Nginx layout

| Purpose | Path |
| --- | --- |
| Frontend available-site file | `/etc/nginx/sites-available/awareai.in` |
| Frontend enabled-site link | `/etc/nginx/sites-enabled/awareai.in` |
| Frontend document root | `/srv/apps/Sapiensfrontend/dist` |
| Backend site | Separate `api.awareai.in` configuration; do not modify for frontend deploys |

The initial HTTP frontend configuration is:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name awareai.in www.awareai.in;

    root /srv/apps/Sapiensfrontend/dist;
    index index.html;
    client_max_body_size 1G;

    location ^~ /assets/ {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    location = /index.html {
        add_header Cache-Control "no-cache";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

`try_files $uri $uri/ /index.html` is required for React routes such as
`/workspace`. Only Vite's hashed `/assets/` files receive immutable caching.
`index.html` is not persistently cached, allowing new deployments to load their
new asset filenames.

Enable and validate the site:

```sh
if [ ! -e /etc/nginx/sites-enabled/awareai.in ]; then
  sudo ln -s /etc/nginx/sites-available/awareai.in /etc/nginx/sites-enabled/awareai.in
fi
sudo nginx -t
sudo systemctl reload nginx
```

Never reload Nginx after a failed `nginx -t`.

## TLS certificates

The API certificate covers `api.awareai.in` only. The frontend uses a separate
Certbot certificate covering both `awareai.in` and `www.awareai.in`. Certbot may
add HTTPS blocks and HTTP-to-HTTPS redirects to the Nginx file, so do not replace
the live file later with the initial HTTP template above.

Issue or reconstruct the frontend certificate only after HTTP works:

```sh
sudo certbot --nginx -d awareai.in -d www.awareai.in --redirect
sudo nginx -t
sudo systemctl reload nginx
```

Inspect certificates and renewal:

```sh
sudo certbot certificates
systemctl status certbot.timer --no-pager
sudo certbot renew --dry-run
```

Certbot-managed certificate material normally lives under
`/etc/letsencrypt/live/awareai.in/`. Never copy private keys into the repository.

## Verification checklist

```sh
test -f /srv/apps/Sapiensfrontend/dist/index.html
sudo nginx -t
curl -I http://awareai.in/
curl -I http://www.awareai.in/
curl -I https://awareai.in/
curl -I https://www.awareai.in/
curl -I https://awareai.in/workspace
curl -fsS https://api.awareai.in/api/orchestrator/status
```

Expected results:

- HTTP redirects to HTTPS after Certbot configuration.
- Both HTTPS hostnames return the SPA successfully.
- `/workspace` returns `index.html`, not a 404.
- Browser developer tools show API requests to
  `https://api.awareai.in/api`, never localhost or public port 8000.
- Only ports 80 and 443 are publicly reachable.

## Routine deployment update

Routine deployments are automated by the repository's `deploy.sh`. It pulls
`origin/main`, performs a frozen-lockfile install using the pnpm store on `/srv`,
and creates a new production `dist` build.

After pushing changes to GitHub, deploy on the VM with:

```sh
cd /srv/apps/Sapiensfrontend
./deploy.sh
```

Run it as the normal deployment user, not with `sudo`. Nginx already reads `dist`
directly, so there is no old frontend process to kill, no frontend systemd service
to restart, and no routine Nginx reload.

## Safe rollback

Find the last known-good commit, check it out without rewriting branch history,
and rebuild it:

```sh
cd /srv/apps/Sapiensfrontend
git status --short
git log --oneline -10
git switch --detach <last-known-good-commit>
pnpm install --frozen-lockfile --store-dir /srv/pnpm-store
pnpm build
test -f dist/index.html
```

After resolving the problem, return to the deployment branch:

```sh
cd /srv/apps/Sapiensfrontend
git switch main
git pull --ff-only
```

For stronger rollback guarantees in the future, keep timestamped release copies
under `/srv/releases/Sapiensfrontend`, never on the root filesystem.

## Troubleshooting

### `ERR_PNPM_IGNORED_BUILDS`

Confirm the latest `pnpm-workspace.yaml` was pulled and contains `allowBuilds`
with `true` for `@tailwindcss/oxide` and `esbuild`. Remove only the incomplete
repository dependency directory and reinstall:

```sh
cd /srv/apps/Sapiensfrontend
rm -rf /srv/apps/Sapiensfrontend/node_modules
pnpm install --frozen-lockfile --store-dir /srv/pnpm-store
```

### pnpm reports `node:sqlite` is missing

The active Node version is too old for pnpm 11.19.0. Confirm Node 22.13+ with
`node --version`. Do not downgrade pnpm independently of `package.json`.

### Pull blocked by local changes

Inspect before discarding anything:

```sh
cd /srv/apps/Sapiensfrontend
git status --short
git diff
```

Never run a destructive Git reset without identifying why the VM working tree is
dirty. Build output and dependencies should remain untracked.

### SPA route returns 404

Check that the frontend Nginx server uses:

```nginx
try_files $uri $uri/ /index.html;
```

Then run `sudo nginx -t` before reloading Nginx.

### Disk usage grows unexpectedly

```sh
df -h / /srv
sudo du -xhd1 / | sort -h
du -hd2 /srv/apps /srv/pnpm-store /srv/releases 2>/dev/null | sort -h
```

Investigate before deleting anything. Do not delete `/srv/pnpm-store`, the live
`dist`, Nginx configuration, certificates, or backend data as routine cleanup.
