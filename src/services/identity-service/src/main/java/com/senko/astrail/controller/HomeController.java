package com.senko.astrail.controller;

import com.senko.astrail.config.CustomUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.stream.Collectors;

@Controller
public class HomeController {

    @GetMapping("/")
    public String index(Model model) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        boolean isAuthenticated = auth != null && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getPrincipal());

        model.addAttribute("isAuthenticated", isAuthenticated);

        if (isAuthenticated) {
            model.addAttribute("username", auth.getName());

            // Extract roles as a comma-separated string for display
            String rolesStr = auth.getAuthorities().stream()
                    .map(Object::toString)
                    .collect(Collectors.joining(", "));
            model.addAttribute("roles", rolesStr);

            // Extract custom fields if principal is CustomUserDetails
            if (auth.getPrincipal() instanceof CustomUserDetails userDetails) {
                model.addAttribute("userId", userDetails.getId());
            } else {
                model.addAttribute("userId", "N/A (Non-custom Principal)");
            }
        }

        return "index";
    }
}
