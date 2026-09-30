from dataclasses import replace
import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.engine import make_url, URL

from app.config import Settings
from app.main import create_app


@pytest.fixture(scope="session")
def settings(tmp_path_factory):
    if not os.getenv("PGHOST") and not os.getenv("TEST_DATABASE_URL"):
        raise pytest.UsageError("Use pg_virtualenv or an isolated TEST_DATABASE_URL; tests require real PostgreSQL.")
    # Tests always select their database explicitly, including when a separate
    # application DATABASE_URL is already exported by the operator.
    result = Settings(None, False, (), tmp_path_factory.mktemp("frontend"))
    if os.getenv("TEST_DATABASE_URL"):
        result = replace(result, database_url=make_url(os.environ["TEST_DATABASE_URL"]).set(drivername="postgresql+psycopg"))
    else:
        # Never let an exported production DATABASE_URL override pg_virtualenv.
        result = replace(result, database_url=URL.create(
            "postgresql+psycopg", username=os.getenv("PGUSER"), password=os.getenv("PGPASSWORD"),
            host=os.environ["PGHOST"], port=int(os.getenv("PGPORT", "5432")),
            database=os.getenv("PGDATABASE", "postgres"),
        ))
    return result


@pytest.fixture
def application(settings):
    app = create_app(settings)
    app.state.database.initialize()
    yield app
    app.state.database.close()


@pytest.fixture
def client(application):
    with TestClient(application) as client:
        yield client
