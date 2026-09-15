# Build stage
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Copy Maven wrapper and project configuration
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Ensure line endings are LF for the wrapper script
RUN sed -i 's/\r$//' mvnw || true

# Resolve dependencies
RUN ./mvnw dependency:go-offline -B || true

# Copy source code and build the package
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Expose port 8080
EXPOSE 8080

# Start application
ENTRYPOINT ["java", "-jar", "app.jar"]
