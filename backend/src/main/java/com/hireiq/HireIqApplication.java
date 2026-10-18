package com.hireiq;

import io.github.cdimascio.dotenv.Dotenv;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;

@SpringBootApplication
public class HireIqApplication {

    private static final Logger log = LoggerFactory.getLogger(HireIqApplication.class);

    public static void main(String[] args) {
        loadDotEnv();
        normalizeRailwayDatabaseUrl();
        SpringApplication.run(HireIqApplication.class, args);
    }

    private static void normalizeRailwayDatabaseUrl() {
        String springDatasourceUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (springDatasourceUrl == null || springDatasourceUrl.isBlank()) {
            springDatasourceUrl = System.getProperty("SPRING_DATASOURCE_URL");
        }
        if (springDatasourceUrl != null && !springDatasourceUrl.isBlank()) {
            return;
        }

        String rawUrl = System.getenv("MYSQL_URL");
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = System.getenv("DATABASE_URL");
        }

        if (rawUrl != null && rawUrl.startsWith("mysql://")) {
            try {
                java.net.URI uri = java.net.URI.create(rawUrl);
                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 3306;
                String path = uri.getPath();
                if (path == null || path.isBlank() || path.equals("/")) {
                    path = "/hireiq";
                }

                String jdbcUrl = "jdbc:mysql://" + host + ":" + port + path + "?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
                System.setProperty("spring.datasource.url", jdbcUrl);
                log.info("Converted raw MySQL URL to JDBC URL for host: {}:{}", host, port);

                String userInfo = uri.getUserInfo();
                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    if (System.getProperty("spring.datasource.username") == null && System.getenv("MYSQL_USER") == null && System.getenv("MYSQLUSER") == null) {
                        System.setProperty("spring.datasource.username", parts[0]);
                    }
                    if (System.getProperty("spring.datasource.password") == null && System.getenv("MYSQL_PASSWORD") == null && System.getenv("MYSQLPASSWORD") == null) {
                        System.setProperty("spring.datasource.password", parts[1]);
                    }
                }
            } catch (Exception e) {
                log.warn("Could not normalize raw database URL: {}", e.getMessage());
            }
        }
    }

    private static void loadDotEnv() {
        String[] paths = {".", "..", "backend"};
        boolean loaded = false;

        for (String path : paths) {
            File envFile = new File(path, ".env");
            if (envFile.exists()) {
                try {
                    Dotenv dotenv = Dotenv.configure().directory(path).ignoreIfMissing().load();
                    dotenv.entries().forEach(entry -> {
                        if (System.getProperty(entry.getKey()) == null) {
                            System.setProperty(entry.getKey(), entry.getValue());
                        }
                    });
                    log.info("Successfully loaded .env file from location: {}", envFile.getAbsolutePath());
                    loaded = true;
                    break;
                } catch (Exception e) {
                    log.warn("Failed to parse .env at {}: {}", envFile.getAbsolutePath(), e.getMessage());
                }
            }
        }

        if (!loaded) {
            log.info("No .env file found in working directories. Utilizing system environment variables or application.yml defaults.");
        }
    }
}
