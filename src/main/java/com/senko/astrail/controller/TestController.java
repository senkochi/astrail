package com.senko.astrail.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/test")
public class TestController {

    private final JdbcTemplate jdbcTemplate;

    public TestController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/public")
    public Map<String, Object> testPublic() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "Success");
        response.put("message", "This is a public celestial beacon. Anyone can read this!");
        response.put("endpoint", "/api/test/public");
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }

    @GetMapping("/user")
    public Map<String, Object> testUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> response = new HashMap<>();
        response.put("status", "Success");
        response.put("message", "Welcome to the Standard User Orbit.");
        response.put("endpoint", "/api/test/user");
        response.put("username", auth.getName());
        response.put("roles", auth.getAuthorities().stream().map(Object::toString).collect(Collectors.toList()));
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }

    @GetMapping("/admin")
    public Map<String, Object> testAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> response = new HashMap<>();
        response.put("status", "Success");
        response.put("message", "Access granted to the Forbidden Administrative Nebula!");
        response.put("endpoint", "/api/test/admin");
        response.put("username", auth.getName());
        response.put("roles", auth.getAuthorities().stream().map(Object::toString).collect(Collectors.toList()));
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }

    @GetMapping("/grant-admin")
    public Map<String, Object> grantAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> response = new HashMap<>();

        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            response.put("status", "Error");
            response.put("message", "You must be logged in to grant admin role.");
            return response;
        }

        String username = auth.getName();
        try {
            boolean hasAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            if (hasAdmin) {
                response.put("status", "Info");
                response.put("message", "User already has ROLE_ADMIN.");
            } else {
                jdbcTemplate.update("INSERT INTO authorities (username, authority) VALUES (?, ?) ON CONFLICT DO NOTHING",
                        username, "ROLE_ADMIN");
                response.put("status", "Success");
                response.put("message", "ROLE_ADMIN granted in database! Please Log Out and Log In again to refresh session roles.");
            }
        } catch (Exception e) {
            response.put("status", "Error");
            response.put("message", "Failed to grant admin role: " + e.getMessage());
        }

        return response;
    }

    @GetMapping("/revoke-admin")
    public Map<String, Object> revokeAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> response = new HashMap<>();

        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            response.put("status", "Error");
            response.put("message", "You must be logged in to revoke admin role.");
            return response;
        }

        String username = auth.getName();
        try {
            jdbcTemplate.update("DELETE FROM authorities WHERE username = ? AND authority = ?", username, "ROLE_ADMIN");
            response.put("status", "Success");
            response.put("message", "ROLE_ADMIN revoked from database! Please Log Out and Log In again to refresh session roles.");
        } catch (Exception e) {
            response.put("status", "Error");
            response.put("message", "Failed to revoke admin role: " + e.getMessage());
        }

        return response;
    }
}
