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
        SpringApplication.run(HireIqApplication.class, args);
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
