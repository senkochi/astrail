package com.senko.astrail.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
    "spring.security.oauth2.client.registration.gateway.client-id=dummy",
    "spring.security.oauth2.client.registration.gateway.client-secret=dummy",
    "spring.security.oauth2.client.provider.astrail-auth-server.authorization-uri=http://localhost:9000/api/auth/authorize",
    "spring.security.oauth2.client.provider.astrail-auth-server.token-uri=http://localhost:9000/api/auth/token",
    "spring.security.oauth2.client.provider.astrail-auth-server.jwk-set-uri=http://localhost:9000/api/auth/jwks",
    "spring.security.oauth2.client.provider.astrail-auth-server.user-info-uri=http://localhost:9000/api/auth/userinfo"
})
class ApiGatewayApplicationTests {

    @Test
    void contextLoads() {
    }
}
