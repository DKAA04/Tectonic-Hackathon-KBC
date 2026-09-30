from dataclasses import dataclass
from pathlib import Path
import os

from sqlalchemy.engine import URL, make_url


ROOT = Path(__file__).resolve().parent.parent


@dataclass(frozen=True)
class Settings:
    database_url: str | URL | None
    secure_cookie: bool
    allowed_origins: tuple[str, ...]
    frontend_dir: Path

    @classmethod
    def from_env(cls) -> "Settings":
        raw = os.getenv("DATABASE_URL")
        database_url = None
        if raw:
            url = make_url(raw)
            if url.drivername not in {"postgres", "postgresql", "postgresql+psycopg"}:
                raise ValueError("DATABASE_URL must use PostgreSQL.")
            database_url = url.set(drivername="postgresql+psycopg")
        elif os.getenv("PGHOST"):
            # pg_virtualenv provides an isolated real PostgreSQL test cluster.
            database_url = URL.create(
                "postgresql+psycopg", username=os.getenv("PGUSER", "postgres"),
                password=os.getenv("PGPASSWORD"), host=os.environ["PGHOST"],
                port=int(os.getenv("PGPORT", "5432")),
                database=os.getenv("PGDATABASE", "postgres"),
            )
        production = os.getenv("APP_ENV") == "production" or bool(os.getenv("RAILWAY_ENVIRONMENT_ID"))
        origins = [s.rstrip("/") for s in os.getenv("ALLOWED_ORIGINS", "").split(",") if s]
        if not production:
            origins += ["http://localhost:5173", "http://127.0.0.1:5173"]
        if os.getenv("APP_ORIGIN"):
            origins.append(os.environ["APP_ORIGIN"].rstrip("/"))
        if os.getenv("RAILWAY_PUBLIC_DOMAIN"):
            origins.append("https://" + os.environ["RAILWAY_PUBLIC_DOMAIN"])
        return cls(database_url, production, tuple(origins), ROOT / "frontend" / "dist")
