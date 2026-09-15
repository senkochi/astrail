package com.senko.astrail.userservice.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @GetMapping("/public")
    public ResponseEntity<Map<String, Object>> getPublicInfo() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "This is public data from User Service");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("username", jwt.getSubject());
        response.put("userId", jwt.getClaim("userId"));
        response.put("roles", jwt.getClaim("roles"));
        response.put("auth_type", jwt.getClaim("auth_type"));
        response.put("claims", jwt.getClaims());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getUserProfile(@AuthenticationPrincipal Jwt jwt) {
        Map<String, Object> response = new HashMap<>();
        response.put("username", jwt.getSubject());
        response.put("userId", jwt.getClaim("userId"));
        response.put("roles", jwt.getClaim("roles"));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/summary")
    public ResponseEntity<Map<String, Object>> getAdminSummary(@AuthenticationPrincipal Jwt jwt) {
        Map<String, Object> response = new HashMap<>();
        response.put("admin", jwt.getSubject());
        response.put("message", "Admin access granted to User Service summary");
        return ResponseEntity.ok(response);
    }
}
