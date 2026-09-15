package com.cardy.identityServer.controller;

import com.cardy.identityServer.dto.UserRegisterDTO;
import com.cardy.identityServer.service.UsersService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class UserController {
    @Autowired
    private UsersService usersService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRegisterDTO req){
        return ResponseEntity.ok(usersService.createUser(req));
    }
}
