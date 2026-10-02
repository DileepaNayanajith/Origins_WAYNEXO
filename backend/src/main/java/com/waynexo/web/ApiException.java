package com.waynexo.web;

import org.springframework.http.HttpStatus;

/** Business/API error with an HTTP status and a user-facing message. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final Object details;

    public ApiException(HttpStatus status, String message, Object details) {
        super(message);
        this.status = status;
        this.details = details;
    }

    public HttpStatus getStatus() { return status; }
    public Object getDetails() { return details; }

    public static ApiException badRequest(String m) { return new ApiException(HttpStatus.BAD_REQUEST, m, null); }
    public static ApiException unauthorized(String m) { return new ApiException(HttpStatus.UNAUTHORIZED, m, null); }
    public static ApiException forbidden(String m) { return new ApiException(HttpStatus.FORBIDDEN, m, null); }
    public static ApiException notFound(String m) { return new ApiException(HttpStatus.NOT_FOUND, m, null); }
    public static ApiException conflict(String m, Object details) { return new ApiException(HttpStatus.CONFLICT, m, details); }
}
