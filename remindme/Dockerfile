FROM gradle:8.8-jdk17 AS build
WORKDIR /app
COPY build.gradle.kts settings.gradle.kts ./
RUN gradle dependencies --no-daemon || true
COPY src ./src
RUN gradle bootJar --no-daemon -x test

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
