package com.senko.astrail.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.UUID;
import java.util.stream.Collectors;

@Controller
public class HomeController {

    private final JdbcTemplate jdbcTemplate;

    public HomeController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/")
    public String index(Model model) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        boolean isAuthenticated = auth != null && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getPrincipal());

        model.addAttribute("isAuthenticated", isAuthenticated);

        if (isAuthenticated) {
            String username = auth.getName();
            model.addAttribute("username", username);

            // Extract roles as a comma-separated string for display
            String rolesStr = auth.getAuthorities().stream()
                    .map(Object::toString)
                    .collect(Collectors.joining(", "));
            model.addAttribute("roles", rolesStr);

            try {
                UUID userId = jdbcTemplate.queryForObject(
                        "SELECT id FROM users WHERE username = ?", UUID.class, username);
                model.addAttribute("userId", userId != null ? userId : "N/A");
            } catch (Exception e) {
                model.addAttribute("userId", "N/A");
            }
        }

        return "index";
    }
}


