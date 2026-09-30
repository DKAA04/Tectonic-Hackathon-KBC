from dataclasses import replace
import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.engine import make_url

from app.config import Settings
from app.main import create_app


@pytest.fixture(scope="session")
def settings(tmp_path_factory):
    if not os.getenv("PGHOST") and not os.getenv("TEST_DATABASE_URL"):
        raise pytest.UsageError("Use pg_virtualenv or an isolated TEST_DATABASE_URL; tests require real PostgreSQL.")
    result = Settings.from_env()
    if os.getenv("TEST_DATABASE_URL"):
        result = replace(result, database_url=make_url(os.environ["TEST_DATABASE_URL"]).set(drivername="postgresql+psycopg"))
    return replace(result, secure_cookie=False, allowed_origins=(), frontend_dir=tmp_path_factory.mktemp("frontend"))


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
