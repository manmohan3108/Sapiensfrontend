
# Sapiens

This is a code bundle for Sapiens. The original project is available at https://www.figma.com/design/O5Q4HuU26a2H8wr74xniqJ/Sapiens.

## Local development

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Without an override, local development uses `http://localhost:8000/api`. Set
`VITE_API_BASE_URL` in a local `.env` file when the API is elsewhere.

## Production build

Vite reads `.env.production` during a production build. The committed value points
the static bundle at `https://api.awareai.in/api`; it is public configuration, not
a secret.

On the VM, build from the repository root:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm build
```

The complete static site is emitted to `dist/`. The frontend is static and needs
no Node process or systemd service after the build. See [DEPLOYMENT.md](DEPLOYMENT.md)
for the complete VM, Nginx, TLS, update, verification, and rollback procedure.
