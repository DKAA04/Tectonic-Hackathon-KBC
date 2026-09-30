#!/bin/sh
set -eu
python -m app.db init
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
