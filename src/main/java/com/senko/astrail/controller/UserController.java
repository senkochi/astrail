package com.senko.astrail.controller;

import com.senko.astrail.dto.UserRegisterDTO;
import com.senko.astrail.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class UserController {
    private final UserService usersService;

    public UserController(UserService usersService) {
        this.usersService = usersService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRegisterDTO req){
        return ResponseEntity.ok(usersService.createUser(req));
    }
}