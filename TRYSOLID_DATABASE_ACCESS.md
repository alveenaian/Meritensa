# Database Access in TrySolid Preview

## The Problem

When trying to access the database interface (Adminer) in TrySolid preview environments, you may encounter an error:

```
ERR_ADDRESS_INVALID
The webpage at https://admin:PASSWORD@preview-xxxxx.codapt.app/codapt/db/ might be temporarily down...
```

## Why This Happens

Modern web browsers (Chrome, Firefox, Safari, etc.) block URLs that embed authentication credentials directly in the URL for security reasons. The format `https://username:password@domain.com` is considered a security risk and is rejected by browsers.

## The Solution

### Option 1: Manual Authentication (Recommended)

Instead of embedding credentials in the URL, access the database interface directly and let the browser prompt you for credentials:

1. **Navigate to**: `https://preview-xxxxx.codapt.app/codapt/db/`
   (Replace `preview-xxxxx` with your actual preview subdomain)

2. **When prompted**, enter:
   - **Username**: `admin`
   - **Password**: The value of your `ADMIN_PASSWORD` environment variable

3. **Check "Remember me"** if you want to stay logged in

### Option 2: Using curl (For API Access)

If you need programmatic access to the database interface:

```bash
curl -u admin:YOUR_PASSWORD https://preview-xxxxx.codapt.app/codapt/db/
```

### Option 3: Direct Database Connection

For direct database access (not through Adminer), use the `DATABASE_URL` environment variable with your database client:

```bash
# Get the DATABASE_URL from your environment
psql $DATABASE_URL
```

## Why Can't TrySolid Fix This?

This is not a TrySolid limitation - it's a **browser security feature** that all modern browsers implement. No preview platform can override this behavior because it's enforced at the browser level.

## What About the "Restart Preview" Button?

The restart preview functionality is controlled by the TrySolid platform, not by the application code. If the restart button isn't working, this is a platform-level issue that should be reported to TrySolid support.

Common causes:
1. **Platform maintenance** - TrySolid may be performing updates
2. **Preview timeout** - The preview session may have expired
3. **Resource limits** - The preview may have hit resource limits

**Workaround**: Create a new preview deployment instead of restarting the existing one.

## Technical Details

### Nginx Configuration

The database interface is protected by HTTP Basic Authentication in nginx:

```nginx
location /codapt/db/ {
    proxy_pass http://adminer:8080/;
    auth_basic "admin";
    auth_basic_user_file /etc/nginx/.htpasswd/htpasswd;
}
```

This is a standard security practice for admin interfaces.

### Environment Variables

The following environment variables are used:

- `ADMIN_PASSWORD`: The password for both database access and admin panel access
- `DATABASE_URL`: The PostgreSQL connection string (provided by TrySolid)

## Best Practices

1. **Never share URLs with embedded credentials** - They can be logged in browser history, proxy logs, etc.
2. **Use HTTPS** - Always access admin interfaces over HTTPS (TrySolid provides this automatically)
3. **Use strong passwords** - The `ADMIN_PASSWORD` should be a strong, randomly generated password
4. **Rotate credentials** - Change the `ADMIN_PASSWORD` regularly, especially if it may have been exposed

## Need Help?

- **Application Issues**: Check the application logs in the TrySolid dashboard
- **Platform Issues**: Contact TrySolid support for preview-specific problems
- **Database Issues**: Check the health endpoint at `https://preview-xxxxx.codapt.app/api/health`
