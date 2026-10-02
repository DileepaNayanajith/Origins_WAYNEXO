package com.waynexo.security;

import com.waynexo.domain.AppUser;
import com.waynexo.repo.AppUserRepository;
import com.waynexo.web.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Access to the authenticated user of the current request.
 * {@link AuthInterceptor} stores only the user id; the entity is (re)loaded here so it is always
 * attached to the current persistence context (lazy relations like depot/outlet then load safely).
 */
@Component
public class AuthContext {

    public static final String ATTR = "waynexo.userId";

    private final AppUserRepository users;

    public AuthContext(AppUserRepository users) {
        this.users = users;
    }

    public Long userId() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) throw ApiException.unauthorized("Not signed in");
        HttpServletRequest req = attrs.getRequest();
        Object id = req.getAttribute(ATTR);
        if (id == null) throw ApiException.unauthorized("Not signed in");
        return (Long) id;
    }

    public AppUser user() {
        return users.findById(userId()).orElseThrow(() -> ApiException.unauthorized("Unknown user"));
    }
}
