package com.waynexo.web;

import com.waynexo.domain.*;
import com.waynexo.dto.AuthDtos.*;
import com.waynexo.repo.*;
import com.waynexo.security.AuthContext;
import com.waynexo.security.JwtService;
import com.waynexo.security.PasswordHasher;
import com.waynexo.service.Mapper;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api")
public class AuthController {

    private final AppUserRepository users;
    private final PasswordHasher hasher;
    private final JwtService jwt;
    private final AuthContext auth;
    private final com.waynexo.service.UserConfiguration configuration;

    public AuthController(AppUserRepository users,
                          PasswordHasher hasher, JwtService jwt, AuthContext auth, com.waynexo.service.UserConfiguration configuration) {
        this.users = users;
        this.hasher = hasher; this.jwt = jwt; this.auth = auth; this.configuration = configuration;
    }

    @PostMapping("/auth/login")
    @Transactional
    public LoginResponse login(@RequestBody LoginRequest req) {
        String username = req.username() == null ? "" : req.username().trim();
        if (username.isEmpty() || username.length() > 255 || req.password() == null || req.password().isEmpty() || req.password().length() > 1024)
            throw ApiException.badRequest("Enter your username and password");
        AppUser user = users.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> ApiException.unauthorized("Incorrect username or password"));
        if (!hasher.matches(req.password(), user.getPasswordHash()))
            throw ApiException.unauthorized("Incorrect username or password");
        return new LoginResponse(jwt.issue(user.getId(), user.getRole()), Mapper.user(user));
    }

    @GetMapping("/auth/me")
    @Transactional(readOnly = true)
    public UserDto me() {
        return Mapper.user(auth.user());
    }

    @GetMapping("/auth/setup")
    @Transactional(readOnly = true)
    public SetupResponse setup() { return configuration.describe(auth.user()); }

    @PutMapping("/auth/setup")
    @Transactional
    public UserDto saveSetup(@RequestBody SetupRequest req) {
        AppUser user = auth.user();
        configuration.save(user, req);
        users.save(user);
        return Mapper.user(user);
    }

    /** Keep the existing Railway healthcheck URL without exposing operational master data. */
    @GetMapping("/public/login-options")
    public java.util.Map<String, String> health() { return java.util.Map.of("status", "ok"); }
}
