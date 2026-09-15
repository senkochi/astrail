package com.senko.astrail.userservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
    "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:9000/api/auth/jwks",
    "spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:9000"
})
class UserServiceApplicationTests {

    @Test
    void contextLoads() {
    }
}
