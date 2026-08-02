# Build stage
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app

# Copy Maven wrapper and project configuration
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Ensure line endings are LF for the wrapper script (useful for Windows hosts)
RUN sed -i 's/\r$//' mvnw

# Resolve dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source code and build the package
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Run stage
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Expose port 9000
EXPOSE 9000

# Start application
ENTRYPOINT ["java", "-jar", "app.jar"]
