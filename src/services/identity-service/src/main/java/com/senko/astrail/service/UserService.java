package com.senko.astrail.service;

import com.senko.astrail.dto.UserRegisterDTO;
import jakarta.transaction.Transactional;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final JdbcUserDetailsManager userDetailsManager;
    private final PasswordEncoder passwordEncoder;

    public UserService(JdbcUserDetailsManager userDetailsManager, PasswordEncoder passwordEncoder){
        this.userDetailsManager = userDetailsManager;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public String createUser(UserRegisterDTO req){
        if(userDetailsManager.userExists(req.getUsername())){
            throw new RuntimeException("Username đã tồn tại");
        }

        UserDetails userDetails = User.builder()
                .username(req.getUsername())
                .password(passwordEncoder.encode(req.getPassword()))
                .roles("USER")
                .build();

        userDetailsManager.createUser(userDetails);
        return "Đăng kí thành công";
    }
}
