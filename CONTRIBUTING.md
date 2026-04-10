# Contributing

This repository uses a canonical `README.md` and `docs/` for detailed developer/demo instructions.

Quick start for developers

1. Start infrastructure:

```powershell
cd BackEnd
docker compose -f docker-compose.infra.yml up -d
```

2. Run user-service locally (optional):

```powershell
cd BackEnd/microservices/user-service
.\mvnw spring-boot:run -Dspring.profiles.active=local
```

3. Frontend:

```bash
cd FrontEnd/duralux-admin
npm ci
npx ng serve
```

Branching and PRs

- Create feature branches from `main`.
- Open a Pull Request and ensure CI passes before merging.

Code of conduct: be respectful and keep commits focused and atomic.
