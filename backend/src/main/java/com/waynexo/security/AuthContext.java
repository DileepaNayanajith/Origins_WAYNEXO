package com.waynexo.security;

import com.waynexo.domain.AppUser;
import com.waynexo.web.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/** Access to the authenticated user of the current request (set by {@link AuthInterceptor}). */
@Component
public class AuthContext {

    public static final String ATTR = "waynexo.user";

    public AppUser user() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) throw ApiException.unauthorized("Not signed in");
        HttpServletRequest req = attrs.getRequest();
        AppUser u = (AppUser) req.getAttribute(ATTR);
        if (u == null) throw ApiException.unauthorized("Not signed in");
        return u;
    }
}
