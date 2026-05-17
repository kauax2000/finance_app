-- After DDL (new columns, etc.), PostgREST must refresh or the API returns
-- "Could not find the 'column_name' ... in the schema cache".
-- Run this in the Supabase SQL Editor, or use Dashboard: Settings → API → Reload schema.

notify pgrst, 'reload schema';
