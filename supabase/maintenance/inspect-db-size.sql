-- Run in the Supabase SQL editor to see WHAT is filling the database.
-- Read-only. Nothing here deletes data.

-- 1. Biggest tables across all schemas (look at the `evolution` schema!)
SELECT n.nspname AS schema,
       c.relname AS table_name,
       pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
       c.reltuples::bigint AS approx_rows
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY pg_total_relation_size(c.oid) DESC
LIMIT 20;

-- 2. Whole database size
SELECT pg_size_pretty(pg_database_size(current_database())) AS database_size;

-- 3. Size of the Evolution API's own schema
SELECT pg_size_pretty(SUM(pg_total_relation_size(c.oid))) AS evolution_schema_size
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'evolution' AND c.relkind = 'r';

-- 4. Optional, AFTER the Evolution env flags are turned off (see hf-evolution-space/README.md):
-- Evolution's stored chat history is not needed - this app keeps its own trimmed copy.
-- Inspect first; table names depend on your Evolution version.
--   SELECT relname, reltuples::bigint FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
--   WHERE n.nspname='evolution' AND c.relkind='r' ORDER BY 2 DESC;
-- Then, for the message/contact/chat history tables ONLY (never "Instance", "Session", "Setting"):
--   TRUNCATE evolution."Message", evolution."MessageUpdate", evolution."Chat", evolution."Contact";
-- followed by VACUUM FULL on those tables to return disk space.
