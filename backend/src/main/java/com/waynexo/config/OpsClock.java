package com.waynexo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

/** Single source of "now" for the operation (Sri Lanka time by default). */
@Component
public class OpsClock {

    private final ZoneId zone;

    public OpsClock(@Value("${waynexo.zone:Asia/Colombo}") String zone) {
        this.zone = ZoneId.of(zone);
    }

    public ZoneId zone() { return zone; }
    public LocalDate today() { return LocalDate.now(zone); }
    public LocalDateTime now() { return LocalDateTime.now(zone); }
}
