package com.waynexo.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Makes the database configuration "just work" on cloud hosts (Railway, Render, …):
 * <ol>
 *   <li>{@code SPRING_DATASOURCE_URL} / {@code DB_HOST} / {@code MYSQLHOST} set → use them (application.yml).</li>
 *   <li>{@code MYSQL_URL} or {@code DATABASE_URL} (mysql://user:pass@host:port/db) set → converted to JDBC.</li>
 *   <li>Running on Railway with no database linked yet → falls back to an embedded H2 database so the
 *       app still starts (data resets on redeploy). Link a MySQL service for persistent data.</li>
 * </ol>
 */
public class DatabaseEnvironment implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment env, SpringApplication application) {
        if (has(env, "SPRING_DATASOURCE_URL") || has(env, "DB_HOST") || has(env, "MYSQLHOST")) return;

        Map<String, Object> props = new HashMap<>();
        String url = first(env, "MYSQL_URL", "MYSQL_PUBLIC_URL", "DATABASE_URL");
        if (url != null && url.startsWith("mysql://")) {
            URI u = URI.create(url);
            String[] cred = u.getUserInfo() == null ? new String[]{"root", ""} : u.getUserInfo().split(":", 2);
            int port = u.getPort() == -1 ? 3306 : u.getPort();
            props.put("spring.datasource.url", "jdbc:mysql://" + u.getHost() + ":" + port + u.getPath()
                    + "?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Colombo");
            props.put("spring.datasource.username", cred[0]);
            props.put("spring.datasource.password", cred.length > 1 ? cred[1] : "");
        } else if (has(env, "RAILWAY_ENVIRONMENT_NAME") || has(env, "RAILWAY_PROJECT_ID") || "true".equals(env.getProperty("WAYNEXO_EMBEDDED_DB"))) {
            props.put("spring.datasource.url", "jdbc:h2:mem:waynexo;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1");
            props.put("spring.datasource.username", "sa");
            props.put("spring.datasource.password", "");
            System.out.println("[WAYNEXO] No MySQL linked — starting with an embedded demo database (data resets on redeploy).");
        }
        if (!props.isEmpty()) env.getPropertySources().addFirst(new MapPropertySource("waynexoDatabase", props));
    }

    private static boolean has(ConfigurableEnvironment env, String key) {
        String v = env.getProperty(key);
        return v != null && !v.isBlank();
    }

    private static String first(ConfigurableEnvironment env, String... keys) {
        for (String k : keys) if (has(env, k)) return env.getProperty(k);
        return null;
    }
}
