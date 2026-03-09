# communication-service

## Required environment variables

- `COMM_DB_HOST`
- `COMM_DB_PORT`
- `COMM_DB_NAME`
- `COMM_DB_USER`
- `COMM_DB_PASSWORD`
- `KEYCLOAK_ISSUER_URI` (optional, default: `http://localhost:8080/realms/nephrospaidi`)
- `EUREKA_DEFAULT_ZONE` (optional)

## Endpoints summary

### Communication

- `POST /api/communication/messages`
- `GET /api/communication/messages/my`
- `GET /api/communication/messages/{id}`
- `POST /api/communication/messages/{id}/reply`
- `POST /api/communication/messages/{id}/close`
- `POST /api/communication/messages/{id}/take`
- `POST /api/communication/messages/{id}/mark-read`
- `POST /api/communication/messages/{id}/escalate`
- `GET /api/communication/backoffice/inbox`
- `GET /api/communication/messages/{id}/audit`

### Appointments

- `POST /api/appointments/requests`
- `GET /api/appointments/my`
- `GET /api/appointments/requests`
- `POST /api/appointments/requests/{id}/approve`
- `POST /api/appointments/requests/{id}/reject`
- `POST /api/appointments/requests/{id}/cancel`

## Roles access matrix

| Action | GUARDIAN | RECEPTIONIST | NURSE | DOCTOR |
|---|---|---|---|---|
| Create message | ✅ | ❌ | ❌ | ❌ |
| My messages | ✅ | ❌ | ❌ | ❌ |
| Inbox | ❌ | ✅ (RECEPTIONIST queue) | ✅ (NURSE queue) | ✅ (DOCTOR queue) |
| Take / mark-read / reply / close | Own messages only | Queue or assigned | Queue or assigned | Queue or assigned |
| Escalate | ❌ | ❌ | ✅ | ❌ |
| Create appointment request | ✅ | ❌ | ❌ | ❌ |
| View own appointment requests | ✅ | ❌ | ❌ | ❌ |
| List appointment requests | ❌ | ✅ | ❌ | ❌ |
| Approve / reject appointment request | ❌ | ✅ | ❌ | ❌ |
| Cancel appointment request | ✅ (own + status REQUESTED/APPROVED) | ❌ | ❌ | ❌ |
