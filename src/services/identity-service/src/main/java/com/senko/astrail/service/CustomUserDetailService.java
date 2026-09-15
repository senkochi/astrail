package com.senko.astrail.service;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@Primary
public class CustomUserDetailService implements UserDetailsService {

    private final JdbcTemplate jdbcTemplate;

    public CustomUserDetailService(JdbcTemplate jdbcTemplate){
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String sql = """
            SELECT u.id, u.username, u.password, u.enabled, string_agg(a.authority, ',') as authorities
            FROM users u
            LEFT JOIN authorities a ON u.username = a.username
            WHERE u.username = ?
            GROUP BY u.id, u.username, u.password, u.enabled
        """;

        try {
            return Objects.requireNonNull(jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
                String authsString = rs.getString("authorities");
                List<SimpleGrantedAuthority> authorities = Collections.emptyList();

                if (authsString != null && !authsString.isEmpty()) {
                    authorities = Arrays.stream(authsString.split(","))
                            .map(SimpleGrantedAuthority::new)
                            .toList();
                }

                return User.builder()
                        .username(rs.getString("username"))
                        .password(rs.getString("password"))
                        .disabled(!rs.getBoolean("enabled"))
                        .authorities(authorities)
                        .build();
            }, username));

        } catch (EmptyResultDataAccessException e) {
            throw new UsernameNotFoundException("Không tìm thấy người dùng: " + username);
        }
    }
}


