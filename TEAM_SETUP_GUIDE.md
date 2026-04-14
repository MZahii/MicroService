# NephroPaidi Backend Setup Guide for Team

## Recent Changes Made (Latest Commit)

After pulling the latest code, **critical configuration changes have been made**. Follow this guide to ensure proper setup.

### Changes Summary
1. ✅ Fixed Lombok annotation processor in all microservices
2. ✅ Fixed PatientProfileController path mapping (`/patients` → `/api/patients`)
3. ✅ Fixed API Gateway routing for pharmacy and ops services
4. ✅ Removed conflicting @PreAuthorize annotations
5. ✅ Created missing observability endpoints

---

## Setup Steps (AFTER pulling latest code)

### Phase 1: Clean Build (Required)
```bash
cd BackEnd

# Clean all compiled classes
mvn clean

# Rebuild all modules with Lombok processing
mvn install -DskipTests
```

**Why?** The Lombok annotation processor changes require a full rebuild. Old `.class` files will cause compilation errors.

---

### Phase 2: Start Infrastructure (in this order)

**Terminal 1 - PostgreSQL & Supporting Services:**
```bash
cd BackEnd
docker-compose -f docker-compose.infra.yml up -d
# Wait 30 seconds for PostgreSQL to be ready
```

**Terminal 2 - Eureka Server:**
```bash
cd BackEnd/eureka
mvn spring-boot:run
# Eureka will be available at http://localhost:8761
```

**Terminal 3 - Config Server:**
```bash
cd BackEnd/config-server
mvn spring-boot:run
# Config server will be available at http://localhost:8888
# It serves configuration to all microservices
```

---

### Phase 3: Start Microservices (wait 5 seconds between each)

**Terminal 4 - API Gateway:**
```bash
cd BackEnd/api-gateway
mvn spring-boot:run
# Gateway runs on http://localhost:8083
# IMPORTANT: This must start AFTER config-server
```

**Terminal 5 - Administration Service:**
```bash
cd BackEnd/microservices/administration-service
mvn spring-boot:run
```

**Terminal 6 - Clinical Service:**
```bash
cd BackEnd/microservices/clinical-service
mvn spring-boot:run
```

**Terminal 7 - Pharmacy Service:**
```bash
cd BackEnd/microservices/pharmacy-service
mvn spring-boot:run
```

**Terminal 8 - Communication Service:**
```bash
cd BackEnd/microservices/communication-service
mvn spring-boot:run
```

**Terminal 9 - User Service:**
```bash
cd BackEnd/microservices/user-service
mvn spring-boot:run
```

---

### Phase 4: Start Frontend

```bash
cd FrontEnd
ng serve
# Frontend will be available at http://localhost:4200
```

---

## Troubleshooting

### Clinical-Service Won't Start
**Symptoms:** Java process appears but closes immediately or shows error

**Solutions:**
1. Check if Lombok is processing: `mvn clean compile -DskipTests` (should show "BUILD SUCCESS")
2. Verify PostgreSQL is running: `docker ps | grep postgres`
3. Check if port 8082 is available: `netstat -ano | findstr :8082`
4. Verify Eureka is running: Go to http://localhost:8761 (should see Eureka UI)
5. Verify Config Server is running: Go to http://localhost:8888/health (should return OK)

### "Failed to load resource: 404" in Frontend
**Symptoms:** Pharmacy endpoints or patient endpoints return 404

**Solutions:**
1. Verify API Gateway is running on port 8083
2. Check that all microservices are registered in Eureka (http://localhost:8761)
3. **Hard refresh browser:** Ctrl+Shift+R (not just Ctrl+R)
4. Check browser console for actual endpoint URLs being called
5. Verify config-server has the correct api-gateway.yml configuration

### "Connection refused" errors
**Cause:** Services are trying to connect before dependencies are ready

**Solution:** Restart services in the correct order:
1. Stop all services
2. Start: Docker → Eureka → Config-Server → API-Gateway → Microservices

---

## Key Port Assignments

| Service | Port | URL |
|---------|------|-----|
| PostgreSQL | 5432 | localhost:5432 |
| Eureka | 8761 | http://localhost:8761 |
| Config Server | 8888 | http://localhost:8888 |
| API Gateway | 8083 | http://localhost:8083 |
| Frontend | 4200 | http://localhost:4200 |
| Administration Service | 8081 | (via gateway) |
| Clinical Service | 8082 | (via gateway) |
| Pharmacy Service | 8084 | (via gateway) |
| User Service | 8085 | (via gateway) |
| Communication Service | 8086 | (via gateway) |

---

## API Routing (through API Gateway)

```
Frontend                    API Gateway (8083)           Microservices
/api/patients        →      /api/patients/** → administration-service
/api/clinical/**     →      /api/clinical/** → clinical-service
/api/pharmacy/**     →      /api/pharmacy/** → pharmacy-service (rewrites to /api/**)
/api/users/**        →      /api/users/**    → user-service
/api/observability** →      /api/observability/** → administration-service
```

---

## Common Issues & Fixes

### Lombok Compilation Won't Work
```bash
# Full rebuild with annotation processing
mvn clean compile -U

# If still fails, clear Maven cache
rm -rf ~/.m2/repository/org/projectlombok
mvn clean install -DskipTests
```

### Port Already in Use
```bash
# Windows - find process using port 8083
netstat -ano | findstr :8083
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :8083
kill -9 <PID>
```

### Config Server Can't Load Configuration Files
- Ensure all `.yml` files are in `BackEnd/config-server/src/main/resources/config/`
- Service names must match filename (e.g., `pharmacy-service.yml` for pharmacy-service)

---

## Performance Tips

- Microservices take 10-20 seconds to start - **be patient**
- First request to a service is slower (warm-up)
- Use `-X` flag if Maven needs verbose output: `mvn spring-boot:run -X`

---

## When Things Still Don't Work

1. **Full clean rebuild:**
   ```bash
   mvn clean install -U -DskipTests
   ```

2. **Check all services are running:**
   ```bash
   curl http://localhost:8761/health  # Eureka health
   curl http://localhost:8888/health  # Config health
   curl http://localhost:8083/health  # Gateway health
   ```

3. **Check service registration in Eureka:**
   Open http://localhost:8761 and verify all services appear in "Instances currently registered with Eureka"

4. **Frontend browser cache:**
   - Open DevTools (F12)
   - Network tab → disable cache checkbox
   - Hard refresh (Ctrl+Shift+R)

---

## Questions?

If you encounter issues not covered here, check the console output for:
- **ClassNotFoundException** → Run `mvn clean compile`
- **Cannot connect to Eureka** → Start Eureka first (port 8761)
- **Cannot connect to database** → Start Docker containers (`docker-compose up -d`)
- **org.springframework.web.bind.annotation.** errors → Likely Lombok issue, run clean compile
