-- Only this application's table is changed. Run through python -m app.db init.
-- The FastAPI database connection is the table owner (postgres on Supabase).
ALTER TABLE public.moment_demo_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.moment_demo_sessions FROM PUBLIC;

-- Defense in depth: an accidental permissive policy or later grant cannot
-- expose rows to non-owner client roles. Owners/BYPASSRLS retain SQL access.
DROP POLICY IF EXISTS moment_backend_only ON public.moment_demo_sessions;
CREATE POLICY moment_backend_only ON public.moment_demo_sessions
    AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);

DO $moment_access$
DECLARE
    client_role text;
    columns_sql text;
BEGIN
    SELECT string_agg(quote_ident(attname), ', ' ORDER BY attnum)
      INTO columns_sql
      FROM pg_attribute
     WHERE attrelid = 'public.moment_demo_sessions'::regclass
       AND attnum > 0 AND NOT attisdropped;

    -- Column grants survive a table-level REVOKE, so remove those as well.
    EXECUTE format('REVOKE ALL PRIVILEGES (%s) ON TABLE public.moment_demo_sessions FROM PUBLIC', columns_sql);
    FOR client_role IN
        SELECT rolname FROM pg_roles
         WHERE rolname IN ('anon', 'authenticated', 'service_role')
    LOOP
        EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.moment_demo_sessions FROM %I', client_role);
        EXECUTE format('REVOKE ALL PRIVILEGES (%s) ON TABLE public.moment_demo_sessions FROM %I', columns_sql, client_role);
    END LOOP;
END
$moment_access$;
