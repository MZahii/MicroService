# NephrosPaidi - Ports and Startup Guide

## 🚀 How to Run in IntelliJ

### Prerequisites
- IntelliJ IDEA Ultimate or Community
- Java 17+
- Maven 3.6+
- Docker Desktop

### Step 1: Start Infrastructure
```bash
cd BackEnd
docker compose up -d
```
Wait for all services to be healthy (Eureka, Keycloak, Gateway).

### Step 2: Configure IntelliJ Run Configuration
1. Open `UserServiceApplication.java`
2. Go to Run → Edit Configurations
3. Set Active profiles: `local`
4. Add VM options (optional): `-Dspring.profiles.active=local`
5. Environment variables (if using Neon):
   - `DB_HOST=your-neon-host`
   - `DB_USER=your-neon-user`
   - `DB_PASSWORD=your-neon-password`
   - `DB_SSL_PARAMS=?sslmode=require`

### Step 3: Run User Service
- Click the green play button or press `Shift+F10`
- Service should start on port 8090

### Step 4: Verify
- Swagger UI: http://localhost:8090/swagger-ui/index.html
- Health check: http://localhost:8090/actuator/health
- Eureka: http://localhost:8761 (should show user-service)

---

## 📋 Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Eureka Server | 8761 | Service Discovery |
| Keycloak | 8080 | Authentication Server |
| API Gateway | 8083 | Edge Router |
| User Service | 8090 | User Management |
| Ops Service | 8082 | Health Checks |
| PostgreSQL (Keycloak) | 5433 | Keycloak DB |

---

## 🎯 Jury Demo Script

### Introduction (2 minutes)
"Bonjour, je vous présente NephrosPaidi, une application médicale basée sur une architecture microservices Spring Boot. Notre système utilise Keycloak pour l'authentification, Eureka pour la découverte de services, et PostgreSQL pour la persistance des données."

### Infrastructure Demo (3 minutes)
1. **Show Docker infrastructure running**
   ```bash
   docker ps
   ```
2. **Show Eureka dashboard**
   - Navigate to http://localhost:8761
   - Explain service discovery concept
3. **Show Keycloak admin console**
   - Navigate to http://localhost:8080/admin
   - Show realm nephrospaidi and users

### User Service Demo (5 minutes)
1. **Start user-service with local profile**
   - Show IntelliJ configuration
   - Start the service
2. **Show Swagger documentation**
   - Navigate to http://localhost:8090/swagger-ui/index.html
   - Explain API endpoints and security
3. **Create users via Swagger**
   - Create ADMIN user via POST /users/internal
   - Create RECEPTIONIST user via POST /users/staff
   - Create GUARDIAN user via POST /users/guardian
4. **List all users**
   - Use GET /users to show created users
5. **Show error handling**
   - Try to create duplicate user to show validation

### Frontend Demo (2 minutes)
1. **Show simple HTML frontend**
   - Navigate to FrontEnd/index.html
   - Show user creation and listing
   - Explain that Angular version will replace this

### Security Demo (3 minutes)
1. **Explain profile-based security**
   - Local profile: no authentication for development
   - Production profile: JWT with Keycloak
2. **Show security configurations**
   - Briefly show SecurityConfig.java and SecurityConfigDev.java
3. **Explain role-based access**
   - PLATFORM_ADMIN can create internal users
   - HR can create staff/guardian users
   - RECEPTIONIST can list users

### Database & Migration Demo (2 minutes)
1. **Show Flyway migrations**
   - Explain V1-V4 migrations
   - Show schema alignment with entities
2. **Explain Neon PostgreSQL integration**
   - Cloud database benefits
   - Connection configuration

### Conclusion (1 minute)
"En résumé, NephrosPaidi démontre une architecture microservices robuste avec une séparation claire des responsabilités, une sécurité basée sur les standards OAuth2/JWT, et une gestion de base de données versionnée avec Flyway. Le système est prêt pour le déploiement en production et peut facilement s'étendre avec de nouveaux services."

---

## 🔧 Configuration Profiles

### Local Profile (Development)
- Database: PostgreSQL (Neon or local)
- Security: Disabled (permit all)
- Flyway: Enabled
- Purpose: Fast development iteration

### Production Profile
- Database: PostgreSQL (Neon)
- Security: JWT with Keycloak
- Flyway: Enabled
- Purpose: Production deployment

### H2 Profile (Testing)
- Database: H2 in-memory
- Security: Disabled
- Flyway: Disabled
- Purpose: Unit testing

---

## 🐛 Common Issues

### Issue: "Cannot load driver class: org.h2.Driver"
**Solution**: Ensure H2 dependency is only in test scope

### Issue: "Connection refused to PostgreSQL"
**Solution**: Check DB_HOST, DB_USER, DB_PASSWORD environment variables

### Issue: "401 Unauthorized from Gateway"
**Solution**: Ensure Keycloak is running and user has correct roles

### Issue: "Flyway validation failed"
**Solution**: Check migration checksums and run `mvn flyway:repair` if needed

1. **Keycloak** (Docker)
   ```bash
   cd BackEnd/keycloak
   docker-compose up -d
   ```

2. **Eureka Server**
   ```bash
   cd BackEnd/eureka
   mvn spring-boot:run
   ```

3. **Microservices** (can be started in parallel after Eureka is up)
   ```bash
   # Operations Service
   cd BackEnd/microservices/ops-service
   mvn spring-boot:run
   
   # Clinical Service
   cd BackEnd/microservices/clinical-service
   mvn spring-boot:run
   
   # Communication Service
   cd BackEnd/microservices/communication-service
   mvn spring-boot:run
   
   # Core Operations Service
   cd BackEnd/microservices/core-ops-service
   mvn spring-boot:run
   
   # Patient Service
   cd BackEnd/microservices/patient-service
   mvn spring-boot:run
   
   # Pharmacy Service
   cd BackEnd/microservices/pharmacy-service
   mvn spring-boot:run
   
   # Procedure Service
   cd BackEnd/microservices/procedure-service
   mvn spring-boot:run
   
   # User Service
   cd BackEnd/microservices/user-service
   mvn spring-boot:run
   ```

4. **API Gateway** (start last)
   ```bash
   cd BackEnd/api-gateway
   mvn spring-boot:run
   ```

## Test URLs

### Direct Service Endpoints

| Service | Health Check | Test Endpoint |
|---------|-------------|---------------|
| Eureka | http://localhost:8761/ | http://localhost:8761/eureka/apps |
| ops-service | http://localhost:8082/actuator/health | http://localhost:8082/ping |
| clinical-service | http://localhost:8084/actuator/health | - |
| communication-service | http://localhost:8085/actuator/health | - |
| core-ops-service | http://localhost:8086/actuator/health | - |
| patient-service | http://localhost:8087/actuator/health | - |
| pharmacy-service | http://localhost:8088/actuator/health | - |
| procedure-service | http://localhost:8089/actuator/health | - |
| user-service | http://localhost:8090/actuator/health | - |

### Gateway Routes

| Route | Gateway URL | Target Service |
|-------|-------------|---------------|
| Ops Service | http://localhost:8083/ops/** | ops-service |
| Clinical Service | http://localhost:8083/clinical-service/** | clinical-service |
| Communication Service | http://localhost:8083/communication-service/** | communication-service |
| Core Ops Service | http://localhost:8083/core-ops-service/** | core-ops-service |
| Patient Service | http://localhost:8083/patient-service/** | patient-service |
| Pharmacy Service | http://localhost:8083/pharmacy-service/** | pharmacy-service |
| Procedure Service | http://localhost:8083/procedure-service/** | procedure-service |
| User Service | http://localhost:8083/user-service/** | user-service |

### Important Gateway Test

```bash
# Test ops-service through gateway (should work with StripPrefix=1)
curl http://localhost:8083/ops/ping

# This should route to: http://localhost:8082/ping
```

## Configuration Notes

- All services use `application.yml` format (no `.properties` files remain active)
- Gateway uses new Spring Cloud Gateway WebFlux configuration format
- All services register with Eureka at `http://localhost:8761/eureka`
- OAuth2 JWT issuer URI: `http://localhost:8080/realms/nephrospaidi`
- Gateway has service discovery enabled with lower-case service IDs

## Troubleshooting

1. **Port conflicts**: Ensure no other applications are using the assigned ports
2. **Eureka registration**: Wait for Eureka to fully start before launching microservices
3. **Gateway routing**: Check Eureka dashboard to confirm services are registered
4. **OAuth2 issues**: Ensure Keycloak is running and accessible at port 8080
