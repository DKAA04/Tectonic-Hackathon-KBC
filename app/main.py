from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta
from hashlib import sha256
import logging
import secrets
from uuid import uuid4

from fastapi import FastAPI, Request, Response, Depends
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, FileResponse
from fastapi.security import APIKeyCookie
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException

from app.config import Settings
from app.corrections import correct, change_consent
from app.db import Database, DemoSession
from app.errors import APIError, error_response
from app.policy import project
from app.schemas import AdvisorPreview, Bootstrap, Context, Correction, ConsentChange, ErrorEnvelope, Health
from app.security import APIBoundary, COOKIE_NAME
from app.seed import seed_evidence


session_cookie = APIKeyCookie(name=COOKIE_NAME, auto_error=False, scheme_name="DemoSessionCookie")
CSRF_DOCUMENTATION = {"parameters": [{"name": "X-CSRF-Token", "in": "header", "required": True,
                                     "schema": {"type": "string"}, "description": "Recover from session.csrf_token in Context."}]}


def utcnow():
    return datetime.now(UTC)


def load_session(db, request: Request, *, lock: bool = False) -> DemoSession:
    token = request.cookies.get(COOKIE_NAME, "")
    if not token or len(token) > 128:
        raise APIError(401, "SESSION_REQUIRED", "Missing, invalid or expired session.")
    statement = select(DemoSession).where(
        DemoSession.token_hash == sha256(token.encode()).hexdigest(),
        DemoSession.expires_at > utcnow(),
    )
    if lock:
        statement = statement.with_for_update()
    row = db.scalar(statement)
    if row is None:
        raise APIError(401, "SESSION_REQUIRED", "Missing, invalid or expired session.")
    return row


def context_for(row: DemoSession) -> Context:
    situation, evidence, decision = project(row.state, row.consent, row.evidence, utcnow().date())
    ids = {item["id"] for item in evidence}
    history = [dict(item, evidence_id=item["evidence_id"] if item["evidence_id"] in ids else None)
               for item in row.history[-50:]]
    return Context(
        session={"id": row.id, "expires_at": row.expires_at.astimezone(UTC), "csrf_token": row.csrf_token},
        version=row.version, updated_at=row.updated_at.astimezone(UTC), consent=row.consent,
        situation=situation, evidence=evidence, decision=decision, history=history,
    )


def authorize_write(row: DemoSession, request: Request, expected_version: int):
    token = request.headers.get("x-csrf-token", "")
    if len(token) > 128 or not secrets.compare_digest(token.encode(), row.csrf_token.encode()):
        raise APIError(403, "CSRF_INVALID", "Missing or incorrect X-CSRF-Token.")
    if expected_version != row.version:
        raise APIError(409, "VERSION_CONFLICT", "Context changed. Fetch the latest context and retry.",
                       [{"field": "expected_version", "message": f"Current version is {row.version}."}])


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings.from_env()
    database = Database(settings)

    @asynccontextmanager
    async def lifespan(app):
        yield
        database.close()

    app = FastAPI(title="KBC Moment — synthetic demo", version="1.0.0",
                  docs_url="/api/docs", redoc_url=None, openapi_url="/api/openapi.json", lifespan=lifespan,
                  responses={status: {"model": ErrorEnvelope} for status in (401, 403, 404, 405, 409, 413, 415, 422, 500, 503)})
    app.state.database = database
    app.state.settings = settings
    app.add_middleware(APIBoundary, allowed_origins=settings.allowed_origins)

    @app.exception_handler(APIError)
    async def api_error(request, error):
        return error_response(error)

    @app.exception_handler(RequestValidationError)
    async def invalid(request, error):
        details = [{"field": ".".join(str(part) for part in item["loc"] if part != "body"),
                    "message": item["msg"]} for item in error.errors()]
        return error_response(APIError(422, "VALIDATION_ERROR", "Request validation failed.", details))

    @app.exception_handler(HTTPException)
    async def http_error(request, error):
        codes = {404: ("NOT_FOUND", "Unknown route."), 405: ("METHOD_NOT_ALLOWED", "Unsupported method.")}
        code, message = codes.get(error.status_code, ("REQUEST_ERROR", "Request failed."))
        return error_response(APIError(error.status_code, code, message))

    @app.exception_handler(SQLAlchemyError)
    async def persistence_error(request, error):
        return error_response(APIError(503, "DATABASE_UNAVAILABLE", "Persistence temporarily unavailable."))

    @app.exception_handler(Exception)
    async def unexpected(request, error):
        logging.getLogger("moment").error("Unexpected request error: %s", type(error).__name__)
        return error_response(APIError(500, "INTERNAL_ERROR", "Unexpected error."))

    @app.get("/api/health", response_model=Health, responses={503: {"model": Health}})
    def health():
        ready = database.ready()
        return JSONResponse(status_code=200 if ready else 503, content={
            "api_version": "1", "status": "ready" if ready else "not_ready",
            "checks": {"database": "ready" if ready else "unavailable"}, "synthetic_only": True,
        })

    @app.post("/api/demo/session", response_model=Context, status_code=201)
    def start_session(body: Bootstrap, response: Response):
        database.require()
        now = utcnow()
        token = secrets.token_urlsafe(32)
        row = DemoSession(
            id=str(uuid4()), token_hash=sha256(token.encode()).hexdigest(),
            csrf_token=secrets.token_urlsafe(32), expires_at=now + timedelta(hours=24),
            updated_at=now, version=1,
            consent={"personalization": True, "synthetic_signals": True, "advisor_preview": True},
            state={"status": "unknown", "source": "none", "move_date": None, "remind_on": None, "evidence_ids": []},
            evidence=seed_evidence(now), history=[],
        )
        with database.sessions.begin() as db:
            db.add(row)
        response.set_cookie(COOKIE_NAME, token, max_age=86400, httponly=True,
                            secure=settings.secure_cookie, samesite="lax", path="/")
        return context_for(row)

    @app.get("/api/context", response_model=Context, dependencies=[Depends(session_cookie)])
    def get_context(request: Request):
        database.require()
        with database.sessions() as db:
            return context_for(load_session(db, request))

    @app.post("/api/context/correction", response_model=Context, dependencies=[Depends(session_cookie)], openapi_extra=CSRF_DOCUMENTATION)
    def correction(body: Correction, request: Request):
        database.require()
        with database.sessions.begin() as db:
            row = load_session(db, request, lock=True)
            authorize_write(row, request, body.expected_version)
            correct(row, body, utcnow())
            result = context_for(row)
        return result

    @app.post("/api/consent", response_model=Context, dependencies=[Depends(session_cookie)], openapi_extra=CSRF_DOCUMENTATION)
    def consent(body: ConsentChange, request: Request):
        database.require()
        with database.sessions.begin() as db:
            row = load_session(db, request, lock=True)
            authorize_write(row, request, body.expected_version)
            change_consent(row, body, utcnow())
            result = context_for(row)
        return result

    @app.get("/api/advisor-preview", response_model=AdvisorPreview, dependencies=[Depends(session_cookie)])
    def advisor(request: Request):
        database.require()
        with database.sessions() as db:
            row = load_session(db, request)
            if not row.consent["advisor_preview"]:
                raise APIError(403, "ADVISOR_CONSENT_REQUIRED", "Advisor preview consent is off.")
            return AdvisorPreview(context=context_for(row))

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str, request: Request):
        if path == "api" or path.startswith("api/"):
            raise APIError(404, "NOT_FOUND", "Unknown API route.")
        root = settings.frontend_dir.resolve()
        target = (root / path).resolve()
        if not target.is_relative_to(root):
            raise APIError(404, "NOT_FOUND", "Unknown route.")
        if target.is_file():
            return FileResponse(target)
        if (root / "index.html").is_file() and "text/html" in request.headers.get("accept", "") and "." not in path.rsplit("/", 1)[-1]:
            return FileResponse(root / "index.html")
        if not path:
            return JSONResponse({"name": "KBC Moment", "synthetic_only": True,
                                 "frontend": "awaiting frontend build", "api_docs": "/api/docs"})
        raise APIError(404, "NOT_FOUND", "Unknown route.")

    return app


app = create_app()
