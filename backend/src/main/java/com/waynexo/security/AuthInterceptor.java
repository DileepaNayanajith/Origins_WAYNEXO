package com.waynexo.security;

import com.waynexo.domain.AppUser;
import com.waynexo.domain.Role;
import com.waynexo.repo.AppUserRepository;
import com.waynexo.web.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Arrays;

/**
 * Validates the Bearer token on every /api request (except /api/auth/login and /api/public/**)
 * and enforces {@link RequireRole} so each role can only reach its own interface's endpoints.
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final JwtService jwt;
    private final AppUserRepository users;

    public AuthInterceptor(JwtService jwt, AppUserRepository users) {
        this.jwt = jwt;
        this.users = users;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod()) || !(handler instanceof HandlerMethod method)) return true;

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) throw ApiException.unauthorized("Please sign in");
        JwtService.Claims claims = jwt.verify(header.substring(7).trim());
        if (claims == null) throw ApiException.unauthorized("Session expired, please sign in again");
        AppUser user = users.findById(claims.userId()).orElseThrow(() -> ApiException.unauthorized("Unknown user"));

        RequireRole rule = method.getMethodAnnotation(RequireRole.class);
        if (rule == null) rule = method.getBeanType().getAnnotation(RequireRole.class);
        if (rule != null) {
            Role[] allowed = rule.value();
            if (Arrays.stream(allowed).noneMatch(r -> r == user.getRole())) {
                throw ApiException.forbidden("This area is not available for the " + user.getRole().name().replace('_', ' ').toLowerCase() + " role");
            }
        }
        request.setAttribute(AuthContext.ATTR, user);
        return true;
    }
}
