package com.senko.astrail.userservice.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @GetMapping("/public")
    public ResponseEntity<Map<String, Object>> getPublicInfo() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "user-service");
        response.put("message", "Public endpoint accessible without authentication");
        response.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("subject", jwt.getSubject());
        userInfo.put("userId", jwt.getClaim("userId"));
        userInfo.put("authType", jwt.getClaim("auth_type"));
        userInfo.put("roles", jwt.getClaim("roles"));
        userInfo.put("claims", jwt.getClaims());
        userInfo.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(userInfo);
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getUserProfile(@AuthenticationPrincipal Jwt jwt) {
        Map<String, Object> profile = new HashMap<>();
        profile.put("username", jwt.getSubject());
        profile.put("userId", jwt.getClaim("userId"));
        profile.put("accountStatus", "ACTIVE");
        profile.put("service", "user-service");
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/admin/summary")
    public ResponseEntity<Map<String, Object>> getAdminSummary(@AuthenticationPrincipal Jwt jwt) {
        Map<String, Object> adminData = new HashMap<>();
        adminData.put("adminUser", jwt.getSubject());
        adminData.put("scope", "ADMINISTRATIVE_ACCESS");
        adminData.put("totalUsersActive", 1);
        adminData.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(adminData);
    }
}
