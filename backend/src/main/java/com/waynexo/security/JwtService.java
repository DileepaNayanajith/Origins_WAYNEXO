package com.waynexo.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.waynexo.domain.Role;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/** Minimal HS256 JSON Web Token issue/verify (no external JWT library needed). */
@Component
public class JwtService {

    private static final Base64.Encoder B64 = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder B64D = Base64.getUrlDecoder();

    private final byte[] secret;
    private final long ttlSeconds;
    private final ObjectMapper mapper = new ObjectMapper();

    public JwtService(@Value("${waynexo.jwt-secret}") String secret, @Value("${waynexo.jwt-hours:12}") long hours) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.ttlSeconds = hours * 3600;
    }

    public record Claims(long userId, Role role, long expiresAt) {}

    public String issue(long userId, Role role) {
        try {
            Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sub", String.valueOf(userId));
            payload.put("role", role.name());
            payload.put("exp", Instant.now().getEpochSecond() + ttlSeconds);
            String h = B64.encodeToString(mapper.writeValueAsBytes(header));
            String p = B64.encodeToString(mapper.writeValueAsBytes(payload));
            return h + "." + p + "." + sign(h + "." + p);
        } catch (Exception e) {
            throw new IllegalStateException("Token creation failed", e);
        }
    }

    /** Returns the claims, or null when the token is missing, tampered or expired. */
    public Claims verify(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return null;
            byte[] expected = sign(parts[0] + "." + parts[1]).getBytes(StandardCharsets.US_ASCII);
            if (!MessageDigest.isEqual(expected, parts[2].getBytes(StandardCharsets.US_ASCII))) return null;
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = mapper.readValue(B64D.decode(parts[1]), Map.class);
            long exp = ((Number) payload.get("exp")).longValue();
            if (exp < Instant.now().getEpochSecond()) return null;
            return new Claims(Long.parseLong((String) payload.get("sub")), Role.valueOf((String) payload.get("role")), exp);
        } catch (Exception e) {
            return null;
        }
    }

    private String sign(String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret, "HmacSHA256"));
        return B64.encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
    }
}
