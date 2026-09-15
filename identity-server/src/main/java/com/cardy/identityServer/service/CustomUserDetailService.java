package com.cardy.identityServer.service;

import com.cardy.identityServer.config.CustomUserDetails;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class CustomUserDetailService implements UserDetailsService {

    private JdbcTemplate jdbcTemplate;

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
                Object idObj = rs.getObject("id");
                UUID userId = (idObj instanceof UUID) ? (UUID) idObj : UUID.fromString(idObj.toString());

                String authsString = rs.getString("authorities");
                List<SimpleGrantedAuthority> authorities = Collections.emptyList();

                if (authsString != null && !authsString.isEmpty()) {
                    authorities = Arrays.stream(authsString.split(","))
                            .map(SimpleGrantedAuthority::new)
                            .toList();
                }

                return CustomUserDetails.builder()
                        .id(userId)
                        .username(rs.getString("username"))
                        .password(rs.getString("password"))
                        .enabled(rs.getBoolean("enabled"))
                        .authorities(authorities)
                        .build();
            }, username));

        } catch (EmptyResultDataAccessException e) {
            throw new UsernameNotFoundException("Không tìm thấy người dùng: " + username);
        }
    }
}
