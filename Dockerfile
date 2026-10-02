# WAYNEXO — single container: React build is served by Spring Boot (same origin, no CORS).
# 1) build the frontend
FROM node:20-alpine AS web
WORKDIR /web
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# 2) build the backend jar with the frontend inside /static
FROM maven:3.9-eclipse-temurin-17 AS api
WORKDIR /api
COPY backend/pom.xml .
RUN mvn -B -q dependency:go-offline || true
COPY backend/src ./src
COPY --from=web /web/dist ./src/main/resources/static
RUN mvn -B -q package -DskipTests

# 3) small runtime image
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=api /api/target/waynexo-backend-1.0.0.jar app.jar
ENV JAVA_OPTS="-Xms128m -Xmx400m" TZ=Asia/Colombo
EXPOSE 8080
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
