# NephrosPaidi - Microservices Medical Application

## 📋 Overview
NephrosPaidi est une application médicale basée sur une architecture microservices avec Spring Boot, Spring Cloud, Keycloak, PostgreSQL (Neon.tech), et une future interface Angular. Elle permet de gérer les utilisateurs (médecins, infirmiers, pharmaciens, etc.) avec authentification JWT et autorisation par rôles.

---

## 🏗️ Architecture

### Infrastructure (Docker)
- **Eureka Server** (port 8761) : Service Discovery
- **API Gateway** (port 8083) : Routage vers les microservices
- **Keycloak** (port 8080) : Authentification OAuth2 / JWT
- **PostgreSQL pour Keycloak** (port 5433)

### Microservices
- **user-service** (port 8090) : Gestion des utilisateurs + authentification
- **ops-service** (port 8082) : Service opérationnel (ping/health)
- **clinical-service**, **pharmacy-service**, **patient-service**, **procedure-service**, **communication-service** : à implémenter

### Base de données
- **Neon.tech** : PostgreSQL cloud pour user-service
- **Flyway** : Migrations de base de données versionnées

---

## 🚀 Démarrage rapide

### 1. Cloner le projet
```bash
git clone <repository-url>
cd NephrosPaidi
```

### 2. Démarrer l'infrastructure Docker
```bash
cd BackEnd
docker compose up -d
```

### 3. Démarrer user-service (local profile)
```bash
cd BackEnd/microservices/user-service
mvn spring-boot:run -Dspring.profiles.active=local
```

### 4. Vérifier les services
- Eureka : http://localhost:8761
- API Gateway : http://localhost:8083/ops/ping
- Keycloak : http://localhost:8080
- User Service Swagger : http://localhost:8090/swagger-ui/index.html

---

## 🔐 Authentification

### Keycloak Realm
- Realm : nephrospaidi
- Client : nephros-app
- Utilisateur de démo : platform-admin / platform-admin

### Rôles disponibles
- PLATFORM_ADMIN
- ADMIN
- HR
- RECEPTIONIST
- DOCTOR
- NURSE
- SURGEON
- PHARMACIST
- GUARDIAN

---

## 📝 Endpoints user-service

### Créer un utilisateur (avec rôle choisi)
```
POST /users/internal
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "username": "dr_ali",
  "email": "ali@nephros.tn",
  "role": "DOCTOR"
}
```

### Créer un staff (rôle STAFF automatique)
```
POST /users/staff
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "username": "staff_mohamed",
  "email": "mohamed@nephros.tn"
}
```

### Créer un tuteur (rôle GUARDIAN automatique)
```
POST /users/guardian
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "username": "guardian_sarra",
  "email": "sarra@nephros.tn"
}
```

### Lister tous les utilisateurs
```
GET /users
Authorization: Bearer <JWT>
```

---

## 🔧 Obtenir un token JWT (une fois par session)
```bash
curl -X POST http://localhost:8080/realms/nephrospaidi/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=nephros-app&username=platform-admin&password=platform-admin"
```
Copier la valeur de `access_token`.

---

## 🗄️ Base de données Neon

### Connexion
1. Aller sur https://console.neon.tech
2. Choisir le projet NephrosPaidi
3. Tables : users, user_roles

### Vérifications SQL
```sql
SELECT * FROM users;
SELECT * FROM users WHERE role = 'DOCTOR';
```

---

## 🛠️ Technologies utilisées

### Backend
- **Java 17+**
- **Spring Boot 3.5.10**
- **Spring Cloud 2025.0.1**
- **Spring Security + OAuth2 Resource Server (JWT)**
- **Spring Data JPA**
- **Flyway**
- **PostgreSQL (Neon.tech)**
- **Eureka (Service Discovery)**
- **Spring Cloud Gateway**
- **Keycloak (Authentification)**
- **Docker & Docker Compose**

### Frontend (prévu)
- **Angular 17+**
- **Keycloak Angular SDK**

---

## 📂 Structure du projet

```
NephrosPaidi/
├── BackEnd/
│   ├── api-gateway/
│   ├── eureka/
│   ├── keycloak/
│   │   ├── docker-compose.yml
│   │   └── realm/
│   │       └── nephrospaidi-realm.json
│   └── microservices/
│       ├── user-service/
│       │   ├── src/main/java/...
│       │   └── src/main/resources/
│       │       ├── application.yml
│       │       └── db/migration/
│       │           ├── V1__Create_initial_schema.sql
│       │           ├── V2__Add_role_column.sql
│       │           └── V3__Relax_users_required_columns.sql
│       └── ops-service/
└── FrontEnd/
    └── (à venir)
```

---

## 🧪 Démonstration pour jury / professeur

### Scénario de démo
1. **Démarrage** : `docker compose up -d` + `user-service`
2. **Authentification** : Obtenir un JWT avec platform-admin
3. **Création** : Créer un DOCTOR, un NURSE, un GUARDIAN
4. **Vérification** : Lister les utilisateurs via GET /users
5. **Base de données** : Montrer les utilisateurs dans Neon

### Résultats attendus
- ✅ Token JWT valide
- ✅ Utilisateurs créés avec bons rôles
- ✅ GET /users retourne la liste
- ✅ Données visibles dans Neon

---

## 📝 Notes importantes

### Sécurité
- Les endpoints sont protégés par JWT
- Les rôles Keycloak sont mappés dans Spring Security
- En dev, un mode "sans token" peut être activé via `DEV_MODE=true`

### Base de données
- **Ne pas supprimer** les fichiers V1/V2/V3 de migration
- Ils garantissent un état cohérent entre environnements
- Flyway gère les versions automatiquement

### Conformité médicale
- Pas de suppression physique d’utilisateurs → préférer l’archivage
- Les données sont persistées dans Neon (cloud sécurisé)

---

## 🚀 Prochaines étapes

### Frontend
- Créer une interface Angular basique pour remplacer Postman
- Login avec Keycloak
- CRUD utilisateurs avec dropdown de rôles

### Microservices
- Implémenter les autres services (clinical, pharmacy, etc.)
- Ajouter inter-service communication (WebClient/Feign)

### Déploiement
- Dockeriser chaque microservice
- Environnements dev / prod

---

## 📞 Support

Pour toute question :
- Vérifier les logs de Docker : `docker compose logs -f`
- Vérifier les logs de user-service : dans la console Maven
- Consulter la base Neon via la console web

---

*Fichier généré le 2025-02-24 pour NephrosPaidi*
