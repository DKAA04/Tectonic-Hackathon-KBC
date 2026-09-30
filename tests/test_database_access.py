"""Exercise Data API role isolation on the disposable real PostgreSQL database."""
import pytest
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError


def prepare_client_roles(database):
    with database.engine.begin() as connection:
        for role in ("anon", "authenticated", "service_role"):
            if not connection.scalar(text("SELECT 1 FROM pg_roles WHERE rolname = :role"), {"role": role}):
                connection.execute(text(f"CREATE ROLE {role} NOLOGIN"))


def test_initialization_preserves_sessions_and_revokes_table_and_column_grants(client, application):
    original = client.post("/api/demo/session", json={}).json()
    database = application.state.database
    prepare_client_roles(database)
    with database.engine.begin() as connection:
        before = connection.scalar(text("SELECT count(*) FROM public.moment_demo_sessions"))
        connection.execute(text("GRANT ALL ON TABLE public.moment_demo_sessions TO PUBLIC, anon, authenticated, service_role"))
        connection.execute(text("GRANT SELECT (token_hash, csrf_token) ON public.moment_demo_sessions TO PUBLIC, anon, authenticated, service_role"))
    database.initialize()
    database.initialize()
    assert client.get("/api/context").json() == original
    with database.engine.connect() as connection:
        assert connection.scalar(text("SELECT count(*) FROM public.moment_demo_sessions")) == before
        assert connection.scalar(text("SELECT relrowsecurity FROM pg_class WHERE oid = 'public.moment_demo_sessions'::regclass"))
        assert connection.scalar(text("SELECT count(*) FROM pg_class, LATERAL aclexplode(relacl) acl WHERE oid = 'public.moment_demo_sessions'::regclass AND acl.grantee = 0")) == 0
        assert connection.scalar(text("SELECT count(*) FROM pg_attribute, LATERAL aclexplode(attacl) acl WHERE attrelid = 'public.moment_demo_sessions'::regclass AND acl.grantee = 0")) == 0
        for role in ("anon", "authenticated", "service_role"):
            for privilege in ("SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"):
                assert not connection.scalar(text("SELECT has_table_privilege(:role, 'public.moment_demo_sessions', :privilege)"), {"role": role, "privilege": privilege})
            assert not connection.scalar(text("SELECT has_any_column_privilege(:role, 'public.moment_demo_sessions', 'SELECT')"), {"role": role})
    for role in ("anon", "authenticated", "service_role"):
        with pytest.raises(DBAPIError) as failure:
            with database.engine.begin() as connection:
                connection.execute(text(f"SET LOCAL ROLE {role}"))
                connection.execute(text("SELECT token_hash, csrf_token FROM public.moment_demo_sessions"))
        assert failure.value.orig.sqlstate == "42501"
    assert database.verify_access() == {
        "table": "public.moment_demo_sessions", "rls": "enabled",
        "restrictive_policy": "deny", "PUBLIC": "denied",
        "client_roles": {"anon": "denied", "authenticated": "denied", "service_role": "denied"},
    }


def test_restrictive_rls_blocks_client_even_after_accidental_select_grant(client, application):
    client.post("/api/demo/session", json={})
    database = application.state.database
    prepare_client_roles(database)
    with database.engine.begin() as connection:
        connection.execute(text("GRANT SELECT ON public.moment_demo_sessions TO anon"))
        connection.execute(text("CREATE POLICY moment_test_permissive ON public.moment_demo_sessions FOR SELECT TO anon USING (true)"))
    try:
        with database.engine.begin() as connection:
            assert connection.scalar(text("SELECT count(*) FROM public.moment_demo_sessions")) > 0
            connection.execute(text("SET LOCAL ROLE anon"))
            assert connection.scalar(text("SELECT count(*) FROM public.moment_demo_sessions")) == 0
    finally:
        with database.engine.begin() as connection:
            connection.execute(text("DROP POLICY moment_test_permissive ON public.moment_demo_sessions"))
        database.initialize()
