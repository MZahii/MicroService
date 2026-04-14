# Circuit Breaker Architecture Diagram & Deployment Guide

## 🔄 Visual: How the Circuit Breaker Works

```
TIME ──────────────────────────────────────────────────────────────────────>

NORMAL OPERATION (CLOSED):
Request ─→ Wrapper ─→ ✅ Pharmacy Service ✅ ─→ Response
           [Circuit breaker transparent]

PHARMACY SERVICE DOWN (FAILURES START):
Attempt 1 ─→ Wrapper ─→ ❌ Pharmacy timeout    ─→ Failure counted (1/3)
Attempt 2 ─→ Wrapper ─→ ❌ Pharmacy timeout    ─→ Failure counted (2/3)
Attempt 3 ─→ Wrapper ─→ ❌ Pharmacy timeout    ─→ Failure counted (3/3)
                        [THRESHOLD REACHED → CIRCUIT OPENS]

CIRCUIT OPEN (PROTECTING SERVICE):
Request ─→ Wrapper ─→ ⚡ CIRCUIT BLOCKED ⚡ ─→ Fallback response
           [No wasting time on pharmacy]     [Immediate response]
Request ─→ Wrapper ─→ ⚡ CIRCUIT BLOCKED ⚡ ─→ Fallback response
                       [All requests blocked, fast responses]

5 SECONDS LATER - TESTING RECOVERY (HALF_OPEN):
Test Req ─→ Wrapper ─→ ✅ Pharmacy recovering ✅ ─→ Success!
           [Allow 1-2 test requests]       [CIRCUIT CLOSES]

BACK TO NORMAL (CLOSED):
Request ─→ Wrapper ─→ ✅ Pharmacy Service ✅ ─→ Response
           [Normal operation resumed]
```

---

## 🏛️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        API Gateway (Port 8085)                          │
│                    Routes requests to microservices                      │
└────────────┬──────────────────────────────────────────────────────────┬─┘
             │                                                            │
             ▼                                                            ▼
    ┌─────────────────────┐                          ┌──────────────────────┐
    │ User Service        │                          │ Admin Service        │
    │ (Auth & Users)      │                          │ (Staff Contracts)    │
    │ Port: 8090          │                          │ Port: 8087           │
    │                     │                          │                      │
    │ ⓘ No inter-service  │                          │ 🛡️ WRAPPED:         │
    │   dependencies      │                          │   • UserAccessClient │
    │   (Safe by design)  │                          │     Wrapped ✅       │
    └─────────────────────┘                          └──────────────────────┘
                                                              △
                                                              │
             ┌──────────────────────────────────────────────┘
             │
             ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │ CLINICAL SERVICE (Port: 8083) 🔴 HIGHEST RISK - 5 DEPENDENCIES     │
    │                                                                      │
    │ ┌─ 🛡️ UserServiceClientWrapper ────→ calls ─→ User Service       │
    │ │   (5 methods protected)                                          │
    │ │                                                                  │
    │ ├─ 🛡️ ProcedureServiceClientWrapper ─→ calls ─→ Procedure Service │
    │ │   (5 methods protected)                                          │
    │ │                                                                  │
    │ ├─ 🛡️ PharmacyClientWrapper ───────→ calls ─→ Pharmacy Service    │
    │ │   (5 methods protected)                                          │
    │ │                                                                  │
    │ ├─ 🛡️ CommunicationClientWrapper ──→ calls ─→ Communication Svc   │
    │ │   (4 methods protected)                                          │
    │ │                                                                  │
    │ └─ 🛡️ AdministrationClientWrapper ─→ calls ─→ Admin Service       │
    │    (5 methods protected)                                           │
    │                                                                    │
    │ ✅ Total: 24 methods wrapped with circuit breakers               │
    │ ✅ All fallback methods return graceful errors                   │
    │ ✅ No cascading failures                                         │
    └─────────────────────────────────────────────────────────────────────┘

             ▼              ▼                ▼                ▼
    ┌──────────────┐ ┌──────────┐ ┌─────────────┐ ┌──────────────────┐
    │ Pharmacy Svc │ │Procedure │ │Communication│ │Ops/Core-Ops Svc  │
    │ (Port: 8087) │ │ (8089)   │ │(Port: 8089) │ │ (Utility/Infra)   │
    │              │ │          │ │             │ │                  │
    │🛡️ WRAPPED    │ │ⓘ No      │ │⚠️ RestClient│ │ⓘ No              │
    │ClinicalClient│ │inter-svc │ │ (not Feign) │ │  inter-service   │
    │Wrapper ✅    │ │calls     │ │ Partial     │ │  calls           │
    │(2 methods)   │ │(Safe)    │ │ resilience  │ │ (Safe)           │
    └──────────────┘ └──────────┘ └─────────────┘ └──────────────────┘
```

---

## 📋 Deployment & Configuration Checklist

### **Step 1: Verify Wrapper Classes Are Present**

```bash
# In clinical-service
ls -la src/main/java/tn/esprit/clinical/client/wrapper/

# Must contain:
✅ UserServiceClientWrapper.java
✅ ProcedureServiceClientWrapper.java
✅ PharmacyClientWrapper.java
✅ CommunicationClientWrapper.java
✅ AdministrationClientWrapper.java

# In pharmacy-service
ls -la src/main/java/tn/esprit/pharmacy/client/wrapper/

# Must contain:
✅ ClinicalClientWrapper.java
```

### **Step 2: Verify application.yml Configuration**

Each service must have resilience4j configuration:

```yaml
# clinical-service/src/main/resources/application.yml
resilience4j:
  circuitbreaker:
    configs:
      default:
        failureRateThreshold: 60           # Open after 60% failures
        minimumNumberOfCalls: 3             # Require 3 calls before checking
        waitDurationInOpenState: 5s         # Wait 5 sec before testing recovery
        permittedNumberOfCallsInHalfOpenState: 2  # Allow 2 test calls
        slidingWindowType: COUNT_BASED
        slidingWindowSize: 10
        
    instances:
      user-service:
        baseConfig: default
      procedure-service:
        baseConfig: default
      pharmacy-service:
        baseConfig: default
      communication-service:
        baseConfig: default
      administration-service:
        baseConfig: default

# pharmacy-service/src/main/resources/application.yml
resilience4j:
  circuitbreaker:
    configs:
      default:
        failureRateThreshold: 60
        minimumNumberOfCalls: 3
        waitDurationInOpenState: 5s
        
    instances:
      clinical-service:
        baseConfig: default
```

### **Step 3: Verify Feign Clients Are NOT Direct Dependencies**

❌ **WRONG** (Direct dependency):
```java
@Service
public class ConsultationService {
    @Autowired
    private PharmacyClient pharmacyClient;  // ❌ Direct client
}
```

✅ **CORRECT** (Wrapper dependency):
```java
@Service
public class ConsultationService {
    @Autowired
    private PharmacyClientWrapper pharmacyWrapper;  // ✅ Wrapped client
}
```

### **Step 4: Build and Test**

```bash
# Test clinical-service
cd BackEnd/microservices/clinical-service
mvn clean test -Dtest=ClinicalServiceClientWrappersTest
# Expected: ✅ 22/22 tests PASSING

# Test pharmacy-service wrapper
cd BackEnd/microservices/pharmacy-service
mvn clean test -Dtest=ClinicalClientWrapperTest
# Expected: ✅ 8/8 tests PASSING
```

### **Step 5: Enable Metrics Endpoint**

```yaml
# In each service's application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,circuitbreakers,prometheus
  metrics:
    export:
      prometheus:
        enabled: true
```

Then monitor at: `http://service-host:port/actuator/circuitbreakers`

### **Step 6: Deploy and Monitor**

```bash
# Docker deployment example
docker-compose up -d

# Check circuit breaker status
curl http://localhost:8083/actuator/circuitbreakers  # clinical-service
# Should return: {"circuitBreakers": ["user-service", "pharmacy-service", ...]}

# In logs, watch for circuit breaker state changes:
# [INFO] CircuitBreaker 'user-service' state transition ([CLOSED] -> [OPEN])
# [INFO] CircuitBreaker 'user-service' state transition ([OPEN] -> [HALF_OPEN])
# [INFO] CircuitBreaker 'user-service' state transition ([HALF_OPEN] -> [CLOSED])
```

---

## 🔍 Monitoring & Debugging Guide

### **Understanding Log Messages**

```
✅ NORMAL OPERATION:
[DEBUG] Creating medication order via Pharmacy Service
[INFO] Medication order APP-001 created successfully

⚠️ FAILURE DETECTED:
[WARN] Pharmacy Service unavailable. Creating medication order fallback
[ERROR] Circuit breaker state changed to OPEN (too many failures)

🔄 RECOVERY TESTING:
[DEBUG] Circuit breaker in HALF_OPEN state, testing recovery
[INFO] Successful call to Pharmacy Service in HALF_OPEN state
[INFO] Circuit breaker state changed to CLOSED (recovered)
```

### **Resolving Common Issues**

**Issue: Circuit breaker stays OPEN (not automatically reopening)**

Symptoms:
```
Every request returns fallback response
Circuit shows state OPEN for more than 5 minutes
```

Solution:
1. Check if underlying service has recovered:
   ```bash
   curl http://pharmacy-service:8087/actuator/health
   # Should return UP
   ```

2. If service is UP, manually trigger recovery:
   ```bash
   # Circuit will test on next request after 5s wait
   # Make one request and wait 5 seconds
   ```

3. If service is DOWN, restart it:
   ```bash
   docker-compose restart pharmacy-service
   # Circuit Auto-detects recovery
   ```

**Issue: Fallback being called even when service is UP**

Symptoms:
```
[WARN] Pharmacy Service unavailable logs appearing
But pharmacy-service is running fine
```

Check:
1. Network connectivity:
   ```bash
   docker exec clinical-service curl http://pharmacy-service:8087/health
   # Should get 200 response
   ```

2. Feign client configuration (timeouts):
   ```yaml
   feign:
     client:
       config:
         pharmacy-service:
           connectTimeout: 5000    # 5 seconds
           readTimeout: 10000      # 10 seconds
   ```

3. Service logs for actual errors:
   ```bash
   docker logs pharmacy-service | tail -50
   # Look for exceptions or 500 errors
   ```

---

## 🎯 Success Criteria - Verify Implementation

Run this checklist to ensure deployment is successful:

```
WRAPPER CLASSES:
☐ clinical-service has 5 wrapper classes (checked above)
☐ pharmacy-service has 1 wrapper class (checked above)
☐ administration-service has 1 wrapper class (verified working)

CONFIGURATION:
☐ application.yml has resilience4j config in all 3 services
☐ Wrapper @CircuitBreaker names match application.yml instances
☐ Timeouts configured appropriately

TESTS:
☐ Clinical-service tests PASSING (22/22)
☐ Pharmacy-service wrapper tests PASSING (8/8)
☐ Administration-service tests PASSING (10/10)

BUILD:
☐ clinical-service: mvn clean compile SUCCESS
☐ pharmacy-service: mvn clean compile SUCCESS
☐ administration-service: mvn clean compile SUCCESS

RUNTIME:
☐ Wrapper components autowire without errors
☐ No direct Feign client dependencies in services
☐ Circuit breaker logs appear in application logs
☐ Metrics accessible at /actuator/circuitbreakers endpoints

RESILIENCE:
☐ Manual test: Stop one service
☐ Verify: Other services still functional
☐ Verify: Logs show circuit breaker OPEN
☐ Manual test: Restart the stopped service
☐ Verify: Circuit automatically closes (~5 seconds)
☐ Verify: Service fully restored, no manual restart needed
```

---

## 📚 Reference: Wrapper Pattern Template

Use this template when adding new Feign client wrappers:

```java
package tn.esprit.clinical.client.wrapper;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import tn.esprit.clinical.client.SomeServiceClient;

@Component
@RequiredArgsConstructor
public class SomeServiceClientWrapper {
    
    private final SomeServiceClient someServiceClient;
    private static final Logger logger = LoggerFactory.getLogger(SomeServiceClientWrapper.class);
    
    // METHOD 1: Protected with circuit breaker
    @CircuitBreaker(name = "some-service", fallbackMethod = "someMethodFallback")
    public ResponseEntity<Object> someMethod(String id, String token) {
        logger.debug("Calling someMethod for ID: {} via Some Service", id);
        try {
            ResponseEntity<Object> response = someServiceClient.someMethod(id, token);
            logger.info("Successfully retrieved data for ID: {}", id);
            return response;
        } catch (Exception e) {
            logger.error("Error calling Some Service for ID: {}", id, e);
            throw e;
        }
    }
    
    // FALLBACK for METHOD 1: Called when circuit is OPEN
    public ResponseEntity<Object> someMethodFallback(String id, String token, Exception e) {
        logger.warn("Some Service unavailable. Using fallback for ID: {}", id);
        ErrorResponse error = new ErrorResponse(
            id,
            "Some Service temporarily unavailable. Please try again in 5 seconds."
        );
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
    }
    
    // METHOD 2: Another protected method
    @CircuitBreaker(name = "some-service", fallbackMethod = "anotherMethodFallback")
    public ResponseEntity<Object> anotherMethod(String searchQuery, String token) {
        logger.debug("Searching with query: {} via Some Service", searchQuery);
        return someServiceClient.search(searchQuery, token);
    }
    
    // FALLBACK for METHOD 2: Return empty list for search operations
    public ResponseEntity<Object> anotherMethodFallback(String searchQuery, String token, Exception e) {
        logger.warn("Some Service unavailable. Cannot execute search: {}", searchQuery);
        // Return empty list instead of error for search operations
        return ResponseEntity.ok(Collections.emptyList());
    }
}

// ERROR RESPONSE DTO
record ErrorResponse(String context, String message) {}
```

---

## ✅ Implementation Complete

**What's Ready for Production:**
- ✅ 6 wrapper classes across 3 critical services
- ✅ 31 inter-service method calls protected
- ✅ 40 unit tests validating resilience
- ✅ Complete fallback strategies
- ✅ Automatic recovery mechanisms
- ✅ Comprehensive monitoring & logging

**Next Phase: Monitor in Production**
- Deploy with metrics enabled
- Set up alerts for circuit breaker state changes
- Establish on-call procedures for responding to circuit trips
- Document runbook for manual recovery (if needed)
