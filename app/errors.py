from fastapi.responses import JSONResponse


class APIError(Exception):
    def __init__(self, status: int, code: str, message: str, details: list[dict] | None = None):
        self.status = status
        self.code = code
        self.message = message
        self.details = details or []


def error_response(error: APIError) -> JSONResponse:
    return JSONResponse(
        status_code=error.status,
        content={"api_version": "1", "error": {
            "code": error.code, "message": error.message, "details": error.details,
        }},
        headers={"Cache-Control": "no-store"},
    )
