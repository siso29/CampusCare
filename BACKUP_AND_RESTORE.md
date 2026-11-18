# Database Backup and Disaster Recovery Guide

This guide establishes the backup policies, automated cron snapshots, and restore procedures for the CampusCare PostgreSQL database.

---

## 1. Backup Strategy

1. **Logical Backups:** Daily full dumps using `pg_dump` compressed with gzip.
2. **Point-In-Time Recovery (PITR):** Write-Ahead Logging (WAL) archiving enabled in production.
3. **Retention Policy:**
   - Daily backups retained for 30 days.
   - Weekly backups retained for 12 weeks.
   - Monthly backups retained for 1 year.
4. **Storage:** Backups must be replicated offsite to encrypted cloud object storage (e.g. AWS S3 Glacier with Object Lock).

---

## 2. Performing Backups

### Manual Backup Command
To take an immediate snapshot of the `campuscare` database:

```bash
# On Windows PowerShell:
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -h localhost -p 5433 -F c -b -v -f "campuscare_backup_$timestamp.dump" campuscare

# On Linux:
pg_dump -U postgres -h localhost -p 5432 -F c -b -v -f "campuscare_backup_$(date +%Y%m%d_%H%M%S).dump" campuscare
```

### Automated Nightly Backup Script (Linux Cron)
`/usr/local/bin/backup-campuscare.sh`:
```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/var/backups/campuscare"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/campuscare_$TIMESTAMP.dump"

mkdir -p "$BACKUP_DIR"

export PGPASSWORD="your_secure_db_password"
pg_dump -U postgres -h 127.0.0.1 -p 5432 -F c -b -v -f "$FILENAME" campuscare

# Prune backups older than 30 days
find "$BACKUP_DIR" -type f -name "*.dump" -mtime +30 -delete

echo "Backup completed: $FILENAME"
```

Add to cron (`crontab -e`):
```cron
0 2 * * * /usr/local/bin/backup-campuscare.sh >> /var/log/campuscare_backup.log 2>&1
```

---

## 3. Restore Procedures

### Restoring to a Fresh Database
1. Create a clean database target:
   ```bash
   createdb -U postgres -h localhost -p 5433 campuscare_restored
   ```
2. Restore the compressed archive:
   ```bash
   pg_restore -U postgres -h localhost -p 5433 -d campuscare_restored -v "campuscare_backup_TIMESTAMP.dump"
   ```
3. Run verification queries to ensure table row counts match expected figures:
   ```sql
   SELECT count(*) FROM universities;
   SELECT count(*) FROM users;
   SELECT count(*) FROM maintenance_requests;
   ```

### Restoring to Active Database in Disaster Recovery
```bash
# Terminate existing active connections
psql -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'campuscare' AND pid <> pg_backend_pid();"

# Drop and recreate database
dropdb -U postgres campuscare
createdb -U postgres campuscare

# Execute restore
pg_restore -U postgres -d campuscare -v "campuscare_backup_TIMESTAMP.dump"
```
