package com.waynexo.web;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "spring.datasource.url=jdbc:h2:mem:proxy-auth;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa", "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class ProxyAuthenticationTest {
    @Autowired TestRestTemplate client;

    @BeforeEach
    void useClientThatPreservesBrowserOriginHeader() {
        client.getRestTemplate().setRequestFactory(new JdkClientHttpRequestFactory());
    }

    private HttpHeaders proxyHeaders(String origin) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setOrigin(origin);
        headers.set("X-Forwarded-Proto", "https");
        headers.set("X-Forwarded-Host", "waynexo.example");
        headers.set("X-Forwarded-Port", "443");
        return headers;
    }

    @Test
    void browserCanLoginAndUseTokenBehindHttpsProxyForEveryRole() {
        String[][] accounts = {
            {"harsha.perera@waynexo.lk", "dispatch123", "DISPATCHER", "DISPATCHER", "/dispatcher/overview"},
            {"nimal.silva@keells.com", "store123", "STORE", "STORE_MANAGER", "/store/catalog"},
            {"WP-9042", "driver123", "DRIVER", "DRIVER", "/driver/home"},
            {"WP-042", "", "LOADER", "LOADER", "/loader/queue"}
        };
        for (String[] account : accounts) {
            HttpHeaders headers = proxyHeaders("https://waynexo.example");
            String body = "{\"identifier\":\"%s\",\"password\":\"%s\",\"portal\":\"%s\"}"
                    .formatted(account[0], account[1], account[2]);
            ResponseEntity<JsonNode> login = client.exchange("/api/auth/login", HttpMethod.POST,
                    new HttpEntity<>(body, headers), JsonNode.class);
            assertThat(login.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(login.getBody().path("user").path("role").asText()).isEqualTo(account[3]);
            headers.setBearerAuth(login.getBody().path("token").asText());
            for (String path : new String[]{"/api/auth/me", "/api" + account[4]}) {
                assertThat(client.exchange(path, HttpMethod.GET, new HttpEntity<>(headers), String.class)
                        .getStatusCode()).isEqualTo(HttpStatus.OK);
            }
        }
    }

    @Test
    void untrustedCrossOriginIsStillRejected() {
        ResponseEntity<String> response = client.exchange("/api/auth/login", HttpMethod.POST,
                new HttpEntity<>("{}", proxyHeaders("https://untrusted.example")), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void wrongPasswordStillReturnsUnauthorizedWithMessage() {
        ResponseEntity<JsonNode> response = client.exchange("/api/auth/login", HttpMethod.POST,
                new HttpEntity<>("{\"identifier\":\"nimal.silva@keells.com\",\"password\":\"wrong\",\"portal\":\"STORE\"}",
                        proxyHeaders("https://waynexo.example")), JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody().path("message").asText()).isEqualTo("Incorrect password");
    }
}
