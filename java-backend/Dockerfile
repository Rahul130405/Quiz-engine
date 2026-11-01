# Multi-stage Dockerfile for QuizEngine Java Servlet Backend & JSP Admin
# Stage 1: Build stage with Maven and OpenJDK 21
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy POM and cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and authorative XML datastore
COPY src ./src
COPY data ./data

# Compile and package the application with dependency libraries
RUN mvn clean package -DskipTests

# Stage 2: Minimal, secure JRE runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create unprivileged system user and group for security
RUN addgroup -S quizgroup && adduser -S quizuser -G quizgroup

# Copy compiled JAR, runtime dependencies, WebApp (JSP views), and XML datastore
COPY --from=build /app/target/quizengine-java-backend-1.0.0.jar /app/app.jar
COPY --from=build /app/target/lib /app/lib
COPY --from=build /app/src/main/webapp /app/src/main/webapp
COPY --from=build /app/data /app/data

# Create directory for embedded Tomcat work files and assign permissions
RUN mkdir -p /app/temp-tomcat && chown -R quizuser:quizgroup /app

# Run as non-root user
USER quizuser

# Runtime environment configuration
ENV JAVA_PORT=8088
ENV QUIZ_DATA_DIR=/app/data
ENV WEBAPP_DIR=/app/src/main/webapp
ENV NODE_API_URL=http://backend:5000/api
ENV NODE_AUTH_URL=http://backend:5000/api/auth/login

EXPOSE 8088

# Health check using Java Backend's /api/java/health endpoint
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8088/api/java/health || exit 1

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
