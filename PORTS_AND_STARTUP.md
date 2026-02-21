# Ports and Startup Guide

## Service Ports Map

| Service | Port | Config File | Status |
|---------|------|-------------|--------|
| keycloak | 8080 | docker-compose | Authentication Server |
| eureka | 8761 | application.yml | Service Registry |
| api-gateway | 8083 | application.yml | API Gateway |
| ops-service | 8082 | application.yml | Operations Service |
| clinical-service | 8084 | application.yml | Clinical Service |
| communication-service | 8085 | application.yml | Communication Service |
| core-ops-service | 8086 | application.yml | Core Operations Service |
| patient-service | 8087 | application.yml | Patient Service |
| pharmacy-service | 8088 | application.yml | Pharmacy Service |
| procedure-service | 8089 | application.yml | Procedure Service |
| user-service | 8090 | application.yml | User Service |

## Startup Order

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
