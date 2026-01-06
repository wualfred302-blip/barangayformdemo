# Supabase SQL Editor - Terminal Guide

This guide shows you how to edit and execute SQL on your Supabase database using the terminal.

## Setup Status

✅ Supabase CLI installed: `~/.local/bin/supabase` (v2.67.1)
✅ Local project initialized
✅ Linked to remote project: `rwjynnebxruknwhqowjp`
✅ Postgres Language Server config created

## Getting Your Database Connection String

To get your database connection string:

1. Go to: https://supabase.com/dashboard/project/rwjynnebxruknwhqowjp/settings/database
2. Find the "Connection string" section
3. Select "URI" tab
4. Click "Copy" on the connection string
5. Update `postgres-language-server.jsonc` with your actual password

## SQL Editing Options

### Option 1: Using Supabase Studio (Web Interface) ⭐ RECOMMENDED

The easiest way to edit SQL is through the Supabase Studio web interface:

1. Go to: https://supabase.com/dashboard/project/rwjynnebxruknwhqowjp
2. Click on "SQL Editor" in the left sidebar
3. Write and execute SQL queries directly in the browser
4. See results, save queries, and manage your database

**Pros:**
- No installation needed
- Visual interface with syntax highlighting
- Save and organize queries
- View results in a table format

### Option 2: Using psql (PostgreSQL Command Line Tool)

Connect directly to your remote database:

\`\`\`bash
# Basic connection
psql "postgresql://postgres:[YOUR-PASSWORD]@db.rwjynnebxruknwhqowjp.supabase.co:5432/postgres"

# Or set as environment variable for easier use
export DB_URL="postgresql://postgres:[YOUR-PASSWORD]@db.rwjynnebxruknwhqowjp.supabase.co:5432/postgres"
psql $DB_URL
\`\`\`

**Useful psql commands:**
\`\`\`sql
-- List all tables
\dt

-- Describe a specific table
\d table_name

-- List all databases
\l

-- List all schemas
\dn

-- Execute a SQL file
\i path/to/your/file.sql

-- Show query history
\s

-- Clear screen
\! clear

-- Exit psql
\q
\`\`\`

### Option 3: Using Supabase CLI to Execute SQL Files

Run your existing SQL migration scripts against the remote database:

\`\`\`bash
# Execute a single SQL file
~/.local/bin/supabase db execute --remote --file scripts/001_create_tables.sql

# Execute SQL directly
~/.local/bin/supabase db execute --remote --sql "SELECT * FROM users;"
\`\`\`

### Option 4: Using VS Code with Postgres Language Server

1. Install the "Postgres Language Server" extension in VS Code
2. Update `postgres-language-server.jsonc` with your database connection string
3. Open any `.sql` file to get:
   - Syntax highlighting
   - Autocompletion based on your database schema
   - Real-time linting and error checking
   - Type checking

### Option 5: Creating and Applying Migrations

The Supabase CLI provides a migration workflow:

\`\`\`bash
# Create a new migration
~/.local/bin/supabase migration new add_new_table

# This creates a file like: supabase/migrations/20250105120000_add_new_table.sql
# Edit this file with your SQL changes

# Apply migrations to remote database
~/.local/bin/supabase db push

# View migration history
~/.local/bin/supabase migration list

# Pull remote schema to local
~/.local/bin/supabase db pull
\`\`\`

## Working with Your Existing SQL Scripts

You have several SQL migration scripts in your `scripts/` directory:

- `scripts/001_create_qrt_ids_table.sql`
- `scripts/001_create_tables.sql`
- `scripts/002_create_tables_no_auth.sql`
- `scripts/003_expanded_schema.sql`
- `scripts/004_qrt_id_system.sql`
- And others...

### To execute these scripts on your remote database:

**Method A: Using psql**
\`\`\`bash
psql "postgresql://postgres:[PASSWORD]@db.rwjynnebxruknwhqowjp.supabase.co:5432/postgres" -f scripts/001_create_tables.sql
\`\`\`

**Method B: Using Supabase CLI**
\`\`\`bash
~/.local/bin/supabase db execute --remote --file scripts/001_create_tables.sql
\`\`\`

### To edit these scripts:

1. Open the file in VS Code: `code scripts/001_create_tables.sql`
2. If Postgres Language Server is configured, you'll get autocompletion
3. Make your changes
4. Execute using one of the methods above

## Common SQL Operations

### View Database Schema
\`\`\`sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- List all columns in a table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'your_table_name';
\`\`\`

### Create a Table
\`\`\`sql
CREATE TABLE example_table (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### Insert Data
\`\`\`sql
INSERT INTO example_table (name) 
VALUES ('Test Entry');
\`\`\`

### Query Data
\`\`\`sql
SELECT * FROM example_table;
\`\`\`

### Update Data
\`\`\`sql
UPDATE example_table 
SET name = 'Updated Name' 
WHERE id = 1;
\`\`\`

### Delete Data
\`\`\`sql
DELETE FROM example_table 
WHERE id = 1;
\`\`\`

## Best Practices

1. **Always backup before making changes**
   \`\`\`sql
   -- Export your database
   pg_dump "postgresql://postgres:[PASSWORD]@db.rwjynnebxruknwhqowjp.supabase.co:5432/postgres" > backup.sql
   \`\`\`

2. **Use transactions for multiple changes**
   \`\`\`sql
   BEGIN;
   -- Your SQL statements here
   COMMIT;
   -- or ROLLBACK; if something goes wrong
   \`\`\`

3. **Test queries on development first**
   \`\`\`bash
   # Use Supabase Studio's SQL Editor to test before running in terminal
   \`\`\`

4. **Use migrations for schema changes**
   \`\`\`bash
   ~/.local/bin/supabase migration new descriptive_name
   # Edit the migration file
   ~/.local/bin/supabase db push
   \`\`\`

## Troubleshooting

### Connection Issues
\`\`\`bash
# Test connection
psql "postgresql://postgres:[PASSWORD]@db.rwjynnebxruknwhqowjp.supabase.co:5432/postgres" -c "SELECT 1;"
\`\`\`

### Check Supabase CLI Status
\`\`\`bash
~/.local/bin/supabase status --debug
\`\`\`

### View Recent Commands
\`\`\`bash
# psql history
cat ~/.psql_history

# Terminal history
history | grep supabase
\`\`\`

## Quick Reference

| Task | Command |
|------|---------|
| Connect to database | `psql "postgresql://postgres:[PASSWORD]@db.rwjynnebxruknwhqowjp.supabase.co:5432/postgres"` |
| Execute SQL file | `psql $DB_URL -f script.sql` |
| Execute SQL directly | `psql $DB_URL -c "SELECT * FROM table;"` |
| Create migration | `~/.local/bin/supabase migration new name` |
| Apply migrations | `~/.local/bin/supabase db push` |
| List migrations | `~/.local/bin/supabase migration list` |
| Execute file remotely | `~/.local/bin/supabase db execute --remote --file script.sql` |
| Open Studio | https://supabase.com/dashboard/project/rwjynnebxruknwhqowjp |

## Next Steps

1. Get your database password from the Supabase dashboard
2. Update `postgres-language-server.jsonc` with your connection string
3. Try connecting with psql to verify access
4. Open Supabase Studio SQL Editor for a visual interface
5. Start editing your SQL files with the Postgres Language Server extension

## Need Help?

- Supabase CLI docs: https://supabase.com/docs/guides/cli
- Supabase Studio docs: https://supabase.com/docs/guides/platform/studio
- PostgreSQL docs: https://www.postgresql.org/docs/
- Postgres Language Server: https://github.com/supabase/postgres-lsp
