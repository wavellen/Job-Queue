# Railway Deployment Guide

Railway is an excellent platform for this project because it provides managed PostgreSQL, Redis, and automatic Docker deployments.

## 1. Setup Database & Redis
1. Go to [Railway.app](https://railway.app) and create a new project.
2. Click **Add Service** and select **Database** -> **PostgreSQL**.
3. Click **Add Service** and select **Database** -> **Redis**.

## 2. Deploy API Service
1. Click **Add Service** -> **GitHub Repo** and select this repository.
2. Railway will detect the `Dockerfile` automatically.
3. In the **Variables** tab for this service, add:
   - `PORT`: `3000`
   - `POSTGRES_URL`: `${{Postgres.DATABASE_URL}}` (Railway will automatically fill this).
   - `REDIS_HOST`: `${{Redis.REDIS_HOST}}`
   - `REDIS_PORT`: `${{Redis.REDIS_PORT}}`
   - `NODE_ENV`: `production`

## 3. Deploy Worker Service
1. Click **Add Service** -> **GitHub Repo** and select the **same repository** again.
2. Rename this service to `worker`.
3. In the **Variables** tab, copy the variables from the API service.
4. Go to **Settings** -> **Deploy** -> **Start Command** and set it to:
   ```bash
   node src/jobs/worker.js
   ```
   (This overrides the default `npm start` which runs the API).

## 4. Run Migrations
Railway doesn't automatically run migrations for every deploy unless specified. You can:
1. Use the **Railway CLI** locally:
   ```bash
   railway run node src/db/migrations.js
   ```
2. **OR** Update your `package.json` start script temporarily to:
   ```json
   "start": "node src/db/migrations.js && node src/api/server.js"
   ```

## 5. Verification
- Once deployed, Railway will provide a public URL for your API service (e.g., `https://job-queue-production.up.railway.app`).
- Access `https://your-url.up.railway.app/health` to verify connectivity.
- Access `https://your-url.up.railway.app/ui` for the Bull Dashboard.

---

### Railway Specific Tips:
- **Pricing:** Managed Redis and Postgres in Railway are quite efficient. For high throughput, ensure you are not on the trial tier as it might throttle I/O.
- **Scaling:** You can scale the `worker` service horizontally in Railway by clicking the "Service" -> "Settings" -> "Replica Count".
