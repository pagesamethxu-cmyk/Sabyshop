# ════════════════════════════════════════════════════════════════════════════
#  Multi-stage Dockerfile for Spring Boot backend
#  Stage 1: Build the JAR with Maven
#  Stage 2: Run the JAR with minimal JRE image
# ════════════════════════════════════════════════════════════════════════════

# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Copy pom.xml first — Docker caches this layer if pom didn't change
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests -q

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -S sabyshop && adduser -S sabyshop -G sabyshop

# Copy the JAR from build stage
COPY --from=builder /build/target/*.jar app.jar

# Create uploads directory
RUN mkdir -p uploads && chown sabyshop:sabyshop uploads

USER sabyshop

# JVM tuning for container environment
ENV JAVA_OPTS="-XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=75.0 \
               -XX:+UseG1GC \
               -XX:+OptimizeStringConcat \
               -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/api/products || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
