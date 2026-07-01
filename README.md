# Acquisitions

## Docker + Neon Database

This project supports two deployment modes:

- Development: use Neon Local in Docker to emulate a Neon database locally.
- Production: use the real Neon cloud database via environment variables.

### Development with Neon Local

1. Copy the development environment template if needed:
   ```bash
   cp .env.development .env
   ```
2. Provide your Neon credentials in the environment variables for Neon Local:
   - `NEON_API_KEY`
   - `NEON_PROJECT_ID`
3. Start the stack:
   ```bash
   docker compose -f docker-compose.dev.yml up --build
   ```
4. The app will connect to:
   ```text
   postgres://neon:npg@neon-local:5432/neon?sslmode=disable
   ```

If `PARENT_BRANCH_ID` is set, Neon Local will create an ephemeral branch from that parent. If it is omitted, Neon Local uses the project's default branch.

### Production with Neon Cloud

1. Create a production environment file:
   ```bash
   cp .env.production .env.production
   ```
2. Replace the placeholder `DATABASE_URL` with your real Neon cloud connection string.
3. Start the production container:
   ```bash
   docker compose --env-file .env.production -f docker-compose.prod.yml up --build -d
   ```

### Environment variable switching

- Development uses `DATABASE_URL` from `.env.development` and the local Neon Local service.
- Production uses `DATABASE_URL` from `.env.production` and does not start Neon Local.

### Notes

- Do not commit real secrets.
- Keep `.env.production` out of source control in real deployments.
- For local development, the Neon Local container is intended to be ephemeral and will be recreated with the compose stack.
