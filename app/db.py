"""Single-table demo persistence; PostgreSQL is required, never SQLite."""
from datetime import datetime
import json
from pathlib import Path
import sys

from sqlalchemy import DateTime, Integer, String, create_engine, select, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from app.config import Settings
from app.errors import APIError


class Base(DeclarativeBase):
    pass


class DemoSession(Base):
    __tablename__ = "moment_demo_sessions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    csrf_token: Mapped[str] = mapped_column(String(64), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    consent: Mapped[dict] = mapped_column(JSONB, nullable=False)
    state: Mapped[dict] = mapped_column(JSONB, nullable=False)
    evidence: Mapped[list] = mapped_column(JSONB, nullable=False)
    history: Mapped[list] = mapped_column(JSONB, nullable=False)


class Database:
    def __init__(self, settings: Settings):
        self.engine = create_engine(
            settings.database_url, pool_pre_ping=True, pool_size=5, max_overflow=5,
            pool_timeout=5, connect_args={"connect_timeout": 3, "options": "-c statement_timeout=5000"},
        ) if settings.database_url else None
        self.sessions = sessionmaker(self.engine, expire_on_commit=False)

    def require(self):
        if self.engine is None:
            raise APIError(503, "DATABASE_UNAVAILABLE", "Persistence temporarily unavailable.")

    def initialize(self):
        self.require()
        # Serialize first-boot schema creation across web processes.
        with self.engine.begin() as connection:
            connection.execute(text("SELECT pg_advisory_xact_lock(68422026)"))
            Base.metadata.create_all(connection)
            # Keep the cookie/CSRF records inaccessible to Supabase Data API roles.
            # Creation and protection commit together; existing rows are preserved.
            connection.execute(text(Path(__file__).with_name("protect_sessions.sql").read_text()))

    def ready(self) -> bool:
        if self.engine is None:
            return False
        try:
            with self.engine.connect() as connection:
                connection.execute(select(DemoSession).limit(1))
            return True
        except Exception:
            return False

    def verify_access(self) -> dict:
        """Report access controls only, without querying or exposing session records."""
        self.require()
        with self.engine.connect() as connection:
            rls = connection.scalar(text("SELECT relrowsecurity FROM pg_class WHERE oid = 'public.moment_demo_sessions'::regclass"))
            policy = connection.scalar(text("SELECT count(*) FROM pg_policy WHERE polrelid = 'public.moment_demo_sessions'::regclass AND polname = 'moment_backend_only' AND NOT polpermissive AND pg_get_expr(polqual, polrelid) = 'false' AND pg_get_expr(polwithcheck, polrelid) = 'false'"))
            public_grants = connection.scalar(text("SELECT count(*) FROM pg_class, LATERAL aclexplode(relacl) acl WHERE oid = 'public.moment_demo_sessions'::regclass AND acl.grantee = 0"))
            public_grants += connection.scalar(text("SELECT count(*) FROM pg_attribute, LATERAL aclexplode(attacl) acl WHERE attrelid = 'public.moment_demo_sessions'::regclass AND acl.grantee = 0"))
            clients = {}
            for role in ("anon", "authenticated", "service_role"):
                if not connection.scalar(text("SELECT 1 FROM pg_roles WHERE rolname = :role"), {"role": role}):
                    clients[role] = "absent"
                    continue
                accessible = any(connection.scalar(text("SELECT has_table_privilege(:role, 'public.moment_demo_sessions', :privilege)"), {"role": role, "privilege": privilege})
                                 for privilege in ("SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"))
                accessible |= any(connection.scalar(text("SELECT has_any_column_privilege(:role, 'public.moment_demo_sessions', :privilege)"), {"role": role, "privilege": privilege})
                                  for privilege in ("SELECT", "INSERT", "UPDATE", "REFERENCES"))
                if accessible:
                    raise RuntimeError("A client role retains access to session records.")
                clients[role] = "denied"
            if not rls or not policy or public_grants:
                raise RuntimeError("Session table protections are incomplete.")
        return {"table": "public.moment_demo_sessions", "rls": "enabled", "restrictive_policy": "deny", "PUBLIC": "denied", "client_roles": clients}

    def close(self):
        if self.engine is not None:
            self.engine.dispose()


def main():
    if sys.argv[1:] not in (["init"], ["verify-access"]):
        raise SystemExit("Usage: python -m app.db init|verify-access")
    database = Database(Settings.from_env())
    try:
        if sys.argv[1] == "init":
            database.initialize()
            print("KBC Moment PostgreSQL schema ready; session table access protected.")
        else:
            print(json.dumps(database.verify_access()))
    except Exception:
        raise SystemExit("PostgreSQL setup/access check failed; verify DATABASE_URL and access.")
    finally:
        database.close()


if __name__ == "__main__":
    main()
