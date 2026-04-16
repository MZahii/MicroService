FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace

COPY pom.xml ./
COPY src ./src
RUN mvn -B -DskipTests clean package

RUN set -eux; \
    JAR_PATH=$(find target -maxdepth 1 -type f -name "*.jar" ! -name "*original*.jar" | head -n 1); \
    test -n "$JAR_PATH"; \
    cp "$JAR_PATH" /workspace/app.jar

FROM eclipse-temurin:17-jre
RUN addgroup --system spring && adduser --system --ingroup spring spring
WORKDIR /app
COPY --from=build /workspace/app.jar /app/app.jar
USER spring:spring
ENTRYPOINT ["java","-XX:+UseContainerSupport","-Djava.security.egd=file:/dev/./urandom","-jar","/app/app.jar"]