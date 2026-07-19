package com.senko.astrail.config;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import com.senko.astrail.service.CustomUserDetailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.config.annotation.web.configurers.oauth2.server.authorization.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.core.oidc.endpoint.OidcParameterNames;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.authorization.*;
import org.springframework.security.oauth2.server.authorization.authentication.OAuth2ClientAuthenticationToken;
import org.springframework.security.oauth2.server.authorization.client.JdbcRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.util.matcher.MediaTypeRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

import javax.sql.DataSource;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Duration;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.core.io.ClassPathResource;
import java.io.InputStream;
import java.security.KeyStore;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${app.security.jwk.keystore-password}")
    private String keystorePassword;

    @Value("${app.security.jwk.key-alias}")
    private String keyAlias;

    @Bean
    @Order(1)
    public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
        OAuth2AuthorizationServerConfigurer authorizationServerConfigurer = new OAuth2AuthorizationServerConfigurer();

        RequestMatcher endpointsMatcher = authorizationServerConfigurer.getEndpointsMatcher();

        http
                .securityMatcher(endpointsMatcher)
                .authorizeHttpRequests(authorize ->
                        authorize.anyRequest().authenticated()
                )
                .csrf(csrf -> csrf
                        .ignoringRequestMatchers(endpointsMatcher)
                )
                .with(authorizationServerConfigurer, (authServer) ->
                        authServer.clientAuthentication(clientAuth ->
                                clientAuth.errorResponseHandler((request, response, exception) -> {
                                    // Log lỗi ra console để debug chính xác tại sao fail
                                    System.out.println("Client Auth Error: " + exception.getMessage());
                                })
                        )
                )
                .apply(authorizationServerConfigurer); // Áp dụng cấu hình

        authorizationServerConfigurer
                .oidc(Customizer.withDefaults()); // Bật OpenID Connect

        http
                .exceptionHandling(exceptions -> exceptions
                        .defaultAuthenticationEntryPointFor(
                                new LoginUrlAuthenticationEntryPoint("/login"),
                                new MediaTypeRequestMatcher(MediaType.TEXT_HTML)
                        )
                )
                .oauth2ResourceServer(resourceServer -> resourceServer
                        .jwt(Customizer.withDefaults()));

        return http.build();

    }

    @Bean
    @Order(2)
    public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws  Exception{
        http
                .authorizeHttpRequests((authorize) -> authorize
                        .requestMatchers("/api/auth/register").permitAll()
                        .anyRequest().authenticated()
                )
                .csrf(csrf -> csrf.disable())
                // Form login handles the redirect to the login page from the
                // authorization server filter chain
                .formLogin(Customizer.withDefaults());

        return http.build();
    }

    @Bean
    public JdbcUserDetailsManager userDetailsManager(DataSource dataSource){
        return new JdbcUserDetailsManager(dataSource);
    }


    @Bean
    public RegisteredClientRepository registeredClientRepository(JdbcTemplate jdbcTemplate){
        JdbcRegisteredClientRepository repository = new JdbcRegisteredClientRepository(jdbcTemplate);

       if(repository.findByClientId("my-client-gateway") == null){
           RegisteredClient testClient = RegisteredClient.withId(UUID.randomUUID().toString())
                   .clientId("my-client-gateway")
                   .clientSecret("{noop}secret")
                   .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                   .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                   .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                   .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
                   .redirectUri("http://127.0.0.1:8080/login/oauth2/code/gateway")
                   .scope(OidcScopes.OPENID)
                   .scope("read")
                   .tokenSettings(TokenSettings.builder()
                           .accessTokenTimeToLive(Duration.ofHours(2))
                           .refreshTokenTimeToLive(Duration.ofHours(1))
                           .reuseRefreshTokens(true)
                           .build())
                   .clientSettings(ClientSettings.builder()
                           .requireProofKey(false)
                           .requireAuthorizationConsent(true)
                           .build())
                   .build();
           repository.save(testClient);
       }
        return repository;
    }

    @Bean
    public OAuth2AuthorizationService authorizationService(
            JdbcTemplate jdbcTemplate, 
            RegisteredClientRepository registeredClientRepository) {
        return new JdbcOAuth2AuthorizationService(jdbcTemplate, registeredClientRepository);
    }
    
    @Bean
    public OAuth2AuthorizationConsentService authorizationConsentService(
            JdbcTemplate jdbcTemplate, 
            RegisteredClientRepository registeredClientRepository) {
        return new JdbcOAuth2AuthorizationConsentService(jdbcTemplate, registeredClientRepository);
    }

    @Bean
    public JWKSource<SecurityContext> jwkSource() {
        char[] password = keystorePassword.toCharArray();
        String alias = keyAlias;
        
        try {
            KeyStore keyStore = KeyStore.getInstance("PKCS12");
            ClassPathResource resource = new ClassPathResource("keystore.p12");
            
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    keyStore.load(is, password);
                }
                RSAPrivateKey privateKey = (RSAPrivateKey) keyStore.getKey(alias, password);
                RSAPublicKey publicKey = (RSAPublicKey) keyStore.getCertificate(alias).getPublicKey();
                
                RSAKey rsaKey = new RSAKey.Builder(publicKey)
                        .privateKey(privateKey)
                        .keyID("astrail-jwt-key-persistent")
                        .build();
                
                System.out.println("INFO: JWK Source initialized with persistent key from keystore.p12");
                return new ImmutableJWKSet<>(new JWKSet(rsaKey));
            }
        } catch (Exception e) {
            System.err.println("ERROR: Failed to load keystore.p12. Falling back to dynamic generation. Reason: " + e.getMessage());
        }

        // Fallback to dynamic key generation
        System.out.println("WARNING: JWK Source initialized with a dynamic RSA key. Issued tokens will invalidate on application restart.");
        KeyPair keyPair = generateRsaKey();
        RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
        RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();
        RSAKey rsaKey = new RSAKey.Builder(publicKey)
                .privateKey(privateKey)
                .keyID(UUID.randomUUID().toString())
                .build();
        return new ImmutableJWKSet<>(new JWKSet(rsaKey));
    }

    private static KeyPair generateRsaKey() {
        KeyPair keyPair;
        try {
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
            keyPairGenerator.initialize(2048);
            keyPair = keyPairGenerator.generateKeyPair();
        } catch (Exception ex){
            throw new IllegalStateException(ex);
        }
        return keyPair;
    }

    @Bean
    public JwtDecoder jwtDecoder(JWKSource<SecurityContext> jwkSource){
        return OAuth2AuthorizationServerConfiguration.jwtDecoder(jwkSource);
    }

    @Bean
    public OAuth2TokenCustomizer<JwtEncodingContext> jwtCustomizer() {
        return context -> {
            Authentication principal = context.getPrincipal();

            JwsHeader.Builder headers = context.getJwsHeader();
            JwtClaimsSet.Builder claims = context.getClaims();
            if (context.getTokenType().equals(OAuth2TokenType.ACCESS_TOKEN)) {

                // Customize headers/claims for access_token
                if (principal instanceof OAuth2ClientAuthenticationToken) {
                    // Đây là quyền của ỨNG DỤNG (Client)
                    context.getClaims().claim("auth_type", "CLIENT");
                } else {
                    // Đây là quyền của CON NGƯỜI (User)
                    context.getClaims().claim("auth_type", "USER");
                }

                if(principal.getPrincipal() instanceof CustomUserDetails userDetails){
                    context.getClaims().claim("userId", userDetails.getId().toString());
                }

                Set<String> authorities = principal.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.toSet());
                context.getClaims().claim("roles", authorities);

            } else if (context.getTokenType().getValue().equals(OidcParameterNames.ID_TOKEN)) {
                // Customize headers/claims for id_token

            }
        };
    }

    @Bean
    public AuthorizationServerSettings authorizationServerSettings(){
        return AuthorizationServerSettings.builder()
                .issuer("http://localhost:9000")
                .authorizationEndpoint("/api/auth/authorize")
                .tokenEndpoint("/api/auth/token")
                .jwkSetEndpoint("/api/auth/jwks")
                .tokenRevocationEndpoint("/api/auth/revoke")
                .tokenIntrospectionEndpoint("/api/auth/check")
                .oidcUserInfoEndpoint("/api/auth/userinfo")
                .oidcLogoutEndpoint("/api/auth/logout")
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder(){
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }



    @Bean
    public AuthenticationProvider authenticationProvider(
            CustomUserDetailService userDetailsService,
            PasswordEncoder passwordEncoder) {

        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        // 2. Kết nối bộ mã hóa mật khẩu (BCrypt) vào đây
        authProvider.setPasswordEncoder(passwordEncoder);

        return authProvider;
    }
}
