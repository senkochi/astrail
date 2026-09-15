package com.cardy.identityServer.service;

import com.cardy.identityServer.dto.UserRegisterDTO;
import jakarta.transaction.Transactional;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.stereotype.Service;

@Service
public class UsersService {
    private final JdbcUserDetailsManager userDetailsManager;
    private final PasswordEncoder passwordEncoder;

    public UsersService(UserDetailsService userDetailsService, PasswordEncoder passwordEncoder){
        this.userDetailsManager = (JdbcUserDetailsManager) userDetailsService;
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
