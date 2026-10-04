# WAYNEXO — one container: the React build is served by Spring Boot (same origin, no CORS needed).

# 1) Frontend
FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# 2) Backend jar (frontend copied into /static)
FROM maven:3.9-eclipse-temurin-17 AS api
WORKDIR /api
COPY backend/pom.xml .
RUN mvn -B -q dependency:go-offline || true
COPY backend/src ./src
RUN rm -rf src/main/resources/static
COPY --from=web /web/dist ./src/main/resources/static
RUN mvn -B -q -DskipTests package

# 3) Runtime
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=api /api/target/waynexo-backend-1.0.0.jar app.jar
ENV TZ=Asia/Colombo JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC"
EXPOSE 8080
CMD ["sh", "-c", "exec java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar app.jar"]
