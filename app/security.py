from fastapi import Request
from starlette.datastructures import Headers

from app.errors import APIError, error_response


COOKIE_NAME = "kbc_moment_session"
MAX_BODY = 8192


class APIBoundary:
    """Bound JSON bodies before parsing and reject cross-origin browser writes."""
    def __init__(self, app, allowed_origins: tuple[str, ...]):
        self.app = app
        self.allowed_origins = allowed_origins

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        is_api = scope["path"] == "/api" or scope["path"].startswith("/api/")
        if is_api and scope["method"] == "POST":
            headers = Headers(scope=scope)
            origin = headers.get("origin")
            same_origin = f"{scope['scheme']}://{headers.get('host', '')}"
            if (origin and origin not in {same_origin, *self.allowed_origins}) or headers.get("sec-fetch-site") == "cross-site":
                return await error_response(APIError(403, "ORIGIN_FORBIDDEN", "Supplied Origin is not allowed."))(scope, receive, send)
            if headers.get("content-type", "").split(";", 1)[0].strip().lower() != "application/json":
                return await error_response(APIError(415, "JSON_REQUIRED", "Write Content-Type must be application/json."))(scope, receive, send)
            body = bytearray()
            while True:
                message = await receive()
                if message["type"] == "http.disconnect":
                    return
                body.extend(message.get("body", b""))
                if len(body) > MAX_BODY:
                    return await error_response(APIError(413, "PAYLOAD_TOO_LARGE", "Request body exceeds 8192 bytes."))(scope, receive, send)
                if not message.get("more_body", False):
                    break
            delivered = False
            original_receive = receive

            async def bounded_receive():
                nonlocal delivered
                if not delivered:
                    delivered = True
                    return {"type": "http.request", "body": bytes(body), "more_body": False}
                return await original_receive()

            receive = bounded_receive

        async def safe_send(message):
            if message["type"] == "http.response.start":
                message["headers"] = list(message.get("headers", []))
                message["headers"].append((b"x-content-type-options", b"nosniff"))
                if is_api and not any(name.lower() == b"cache-control" for name, _ in message["headers"]):
                    message["headers"].append((b"cache-control", b"no-store"))
            await send(message)

        await self.app(scope, receive, safe_send)
