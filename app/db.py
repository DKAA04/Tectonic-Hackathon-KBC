"""Single-table demo persistence; PostgreSQL is required, never SQLite."""
from datetime import datetime
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

    def ready(self) -> bool:
        if self.engine is None:
            return False
        try:
            with self.engine.connect() as connection:
                connection.execute(select(DemoSession.id).limit(1))
            return True
        except Exception:
            return False

    def close(self):
        if self.engine is not None:
            self.engine.dispose()


def main():
    if sys.argv[1:] != ["init"]:
        raise SystemExit("Usage: python -m app.db init")
    database = Database(Settings.from_env())
    try:
        database.initialize()
    except Exception:
        raise SystemExit("PostgreSQL schema initialization failed; verify DATABASE_URL and access.")
    finally:
        database.close()
    print("KBC Moment PostgreSQL schema ready.")


if __name__ == "__main__":
    main()
