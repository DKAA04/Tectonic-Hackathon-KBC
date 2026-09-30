FROM node:22-bookworm-slim AS frontend-build
WORKDIR /build
# Build an actual frontend only when Windows supplies its package + lockfile.
COPY . .
RUN mkdir -p /web-dist && \
    if [ -f frontend/package.json ]; then \
      cd frontend && npm ci && npm run build && cp -a dist/. /web-dist/; \
    fi

FROM python:3.13-slim-bookworm AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 APP_ENV=production
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    useradd --create-home --uid 10001 moment
COPY app ./app
COPY fixtures ./fixtures
COPY --from=frontend-build /web-dist ./frontend/dist
USER moment
EXPOSE 8000
CMD ["sh", "app/start.sh"]
