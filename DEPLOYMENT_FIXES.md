# Deployment Fixes - Preventing Stuck Deployments

## Problem
The application was getting stuck during deployment startup, making it impossible to:
- Delete the deployment
- Restart the preview
- See the application running

This was caused by the setup script hanging indefinitely when services (database, Minio) were not ready or when operations timed out.

## Root Causes Identified

1. **No timeouts on operations**: Database and Minio operations could hang indefinitely
2. **No retry logic**: If a service wasn't ready immediately, the setup would fail
3. **Blocking failures**: If any non-critical operation failed, the entire app wouldn't start
4. **No health checks**: Docker services started before they were ready to accept connections
5. **No graceful degradation**: The app required all services to be 100% ready

## Fixes Implemented

### 1. Setup Script Improvements (`src/server/scripts/setup.ts`)

**Added timeout handling:**
```typescript
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string)
```
- All operations now have a maximum timeout (5-15 seconds depending on operation)
- Overall setup timeout of 2 minutes prevents infinite hanging

**Added retry logic with exponential backoff:**
```typescript
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number, operation: string)
```
- Database connection: 10 retries with exponential backoff
- Minio connection: 10 retries with exponential backoff
- Other operations: 3 retries

**Added health checks:**
- `checkDatabaseConnection()`: Verifies database is ready before proceeding
- `checkMinioConnection()`: Verifies Minio is ready before proceeding

**Graceful degradation:**
- If Minio isn't ready, skip bucket setup but continue (file uploads can be configured later)
- If feature seeding fails, log warning but continue
- If page seeding fails, log warning but continue
- Setup script exits with code 0 even on errors to allow app to start

### 2. Docker Compose Health Checks (`docker/compose.yaml`)

**Added health checks to all services:**

**Postgres:**
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 5s
  timeout: 5s
  retries: 5
  start_period: 10s
```

**Redis:**
```yaml
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 5s
  timeout: 3s
  retries: 5
  start_period: 5s
```

**Minio:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
  interval: 10s
  timeout: 5s
  retries: 3
  start_period: 10s
```

**App:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 10s
  timeout: 5s
  retries: 3
  start_period: 30s
```

**Updated app service dependencies:**
```yaml
depends_on:
  redis:
    condition: service_healthy
  postgres:
    condition: service_healthy
  minio:
    condition: service_healthy
```

Now the app only starts after all dependent services are healthy and ready to accept connections.

### 3. Database Connection Configuration (`src/server/db.ts`)

**Added connection timeouts to Prisma:**
```typescript
databaseUrl.searchParams.set("connection_limit", "10"); // Maximum pool size
databaseUrl.searchParams.set("pool_timeout", "10"); // Pool timeout in seconds
databaseUrl.searchParams.set("connect_timeout", "10"); // Connection timeout in seconds
```

This prevents Prisma from hanging indefinitely when trying to connect to the database.

### 4. Health Check Endpoint (`src/routes/api.health.ts`)

**Created a simple HTTP health check endpoint:**
- Accessible at `GET /api/health`
- Does not require authentication
- Checks database connectivity with 5-second timeout
- Returns JSON with status and timestamp
- Returns 200 when healthy, 500 when unhealthy

This endpoint is used by:
- Docker health checks
- Load balancers
- Monitoring systems
- Deployment platforms

### 5. tRPC Health Check (`src/server/trpc/procedures/health.procedures.ts`)

**Added a tRPC health check procedure:**
- Accessible via tRPC client as `trpc.health.query()`
- Checks database connectivity
- Can be used by authenticated clients for monitoring

## Testing the Fixes

### Local Testing

1. **Start the application:**
   ```bash
   ./scripts/run
   ```

2. **Check health endpoint:**
   ```bash
   curl http://localhost:3000/api/health
   ```
   
   Should return:
   ```json
   {
     "status": "ok",
     "timestamp": "2024-01-01T00:00:00.000Z",
     "services": {
       "database": "healthy"
     }
   }
   ```

3. **Check Docker health status:**
   ```bash
   docker compose ps
   ```
   
   All services should show "healthy" status.

### Deployment Testing

1. **Deploy to hosting platform** (TrySolid, Vercel, etc.)
2. **Check startup logs** - should see:
   ```
   === Starting application setup ===
   [1/6] Checking database connection...
   ✓ Database is ready
   [2/6] Checking Minio connection...
   ✓ Minio is ready
   ...
   === Setup completed in XXXXms ===
   ```

3. **If a service is not ready**, you'll see retries:
   ```
   Database connection check failed (attempt 1/10): ...
   Retrying in 1000ms...
   ```

4. **Health check endpoint** should be accessible at your deployment URL:
   ```
   https://your-deployment-url.com/api/health
   ```

## Troubleshooting

### Deployment Still Stuck?

1. **Check environment variables** - ensure all required variables are set:
   - `DATABASE_URL`
   - `ADMIN_PASSWORD`
   - `ANTHROPIC_API_KEY`

2. **Check service logs:**
   ```bash
   docker compose logs postgres
   docker compose logs minio
   docker compose logs app
   ```

3. **Check health status:**
   ```bash
   docker compose ps
   ```

4. **Manually test database connection:**
   ```bash
   docker compose exec app npx prisma db push
   ```

### Health Check Failing?

1. **Database not ready:**
   - Check DATABASE_URL is correct
   - Verify database is running
   - Check network connectivity

2. **Minio not ready:**
   - Check ADMIN_PASSWORD is set
   - Verify Minio is running
   - Check port 9000 is accessible

3. **App not starting:**
   - Check all environment variables
   - Review startup logs
   - Verify no port conflicts

## Benefits

✅ **No more stuck deployments** - Setup script always completes (with or without errors)
✅ **Faster failure detection** - Timeouts prevent infinite waiting
✅ **Better resilience** - Retry logic handles transient failures
✅ **Graceful degradation** - Non-critical failures don't block startup
✅ **Better observability** - Health checks provide clear status
✅ **Platform compatibility** - Works with all hosting platforms that support Docker health checks

## Monitoring

The health check endpoint can be used for:
- Uptime monitoring (Pingdom, UptimeRobot, etc.)
- Load balancer health checks
- Container orchestration health checks
- CI/CD deployment verification
- Automated alerting

Example monitoring setup:
```bash
# Check every 30 seconds
*/30 * * * * curl -f https://your-app.com/api/health || alert-team
