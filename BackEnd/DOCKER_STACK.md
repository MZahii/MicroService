# Docker Stack Guide (Safe Rollout)

This guide runs the full backend stack in Docker:
- `keycloak`
- `eureka`
- `config-server`
- `api-gateway`
- microservices (`administration`, `user`, `clinical`, `communication`, `ops`, `pharmacy`, `procedure`)

`core-ops-service` is included as an optional profile (`legacy-core-ops`).

## 1) Prerequisites

- Docker Desktop running
- Build from repo root, using file: `BackEnd/docker-compose.stack.yml`
- Ensure `BackEnd/.env` exists (copy from `.env.example`)

```powershell
Copy-Item BackEnd/.env.example BackEnd/.env
```

## 2) Safe Bring-Up Sequence

Use this order to reduce startup race issues:

```powershell
# from repo root
cd BackEnd

# Step A: infra + discovery/config
Docker compose -f docker-compose.stack.yml up -d keycloak eureka config-server

# Step B: gateway
Docker compose -f docker-compose.stack.yml up -d api-gateway

# Step C: microservices
Docker compose -f docker-compose.stack.yml up -d administration-service user-service clinical-service communication-service ops-service pharmacy-service procedure-service
```

## 3) Rebuild API Gateway Safely (fix corrupted image)

When gateway image looks broken/corrupted, rebuild only it from scratch:

```powershell
cd BackEnd
Docker compose -f docker-compose.stack.yml build --no-cache api-gateway
Docker compose -f docker-compose.stack.yml up -d api-gateway
Docker compose -f docker-compose.stack.yml logs -f api-gateway
```

If still bad, force clean image/container and recreate:

```powershell
cd BackEnd
Docker compose -f docker-compose.stack.yml stop api-gateway
Docker compose -f docker-compose.stack.yml rm -f api-gateway
Docker image rm nephropaidi-stack-api-gateway 2>$null
Docker compose -f docker-compose.stack.yml build --no-cache api-gateway
Docker compose -f docker-compose.stack.yml up -d api-gateway
```

## 4) Health/Debug Commands

```powershell
cd BackEnd
Docker compose -f docker-compose.stack.yml ps
Docker compose -f docker-compose.stack.yml logs -f config-server
Docker compose -f docker-compose.stack.yml logs -f eureka
Docker compose -f docker-compose.stack.yml logs -f api-gateway
Docker compose -f docker-compose.stack.yml logs -f ops-service
```

## 5) Optional Legacy Service

Run `core-ops-service` only when needed:

```powershell
cd BackEnd
Docker compose -f docker-compose.stack.yml --profile legacy-core-ops up -d core-ops-service
```

## 6) Stop/Cleanup

```powershell
cd BackEnd
# Stop stack
Docker compose -f docker-compose.stack.yml down

# Stop + remove images built by compose (keeps external DB data untouched)
Docker compose -f docker-compose.stack.yml down --rmi local
```

## Notes

- Services are configured to use container DNS names (`config-server`, `eureka`, `keycloak`) via environment overrides.
- Host ports are remapped to avoid conflict with locally running services:
  - `config-server`: `8889 -> 8888`
  - `api-gateway`: `8086 -> 8083`
  - microservices: `1808x/1809x` host range -> original internal ports
- Runtime containers use non-root user in Dockerfiles.
- Docker build context excludes `target/`, `.idea/`, and VCS files via `.dockerignore`.
