package com.hireiq.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;


import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AiService {

    private final WebClient webClient;
    private final String apiKey;
    private final String model;
    private final String provider;
    private final ObjectMapper objectMapper;

    public AiService(
            @Value("${ai.provider:nvidia}") String provider,
            @Value("${ai.api-key:}") String apiKey,
            @Value("${ai.model:nvidia/nemotron-3-super-120b-a12b}") String model,
            @Value("${ai.base-url:https://integrate.api.nvidia.com/v1}") String baseUrl
    ) {
        this.provider = provider;
        this.apiKey = apiKey;
        this.model = model;
        this.objectMapper = new ObjectMapper();

        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /**
     * Call AI completion using OpenAI-compatible format.
     * Throws RuntimeException on any failure — no mock fallback.
     */
    public String chat(String systemPrompt, String userMessage) {
        if (apiKey == null || apiKey.isBlank() || apiKey.contains("dummy")) {
            throw new RuntimeException("AI API key is not configured. Please set AI_API_KEY in your environment.");
        }

        log.info("Calling AI model: {} via {}", model, provider);

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "temperature", 0.2,
                "max_tokens", 8192,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userMessage)
                )
        );

        try {
            String responseJson = webClient.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .onStatus(status -> status.isError(), clientResponse ->
                            clientResponse.bodyToMono(String.class).flatMap(body -> {
                                log.error("AI API error {}: {}", clientResponse.statusCode(), body);
                                return reactor.core.publisher.Mono.error(
                                        new RuntimeException("AI service returned " + clientResponse.statusCode() + ": " + body));
                            })
                    )
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode choices = root.get("choices");
            if (choices != null && choices.isArray() && !choices.isEmpty()) {
                return choices.get(0).get("message").get("content").asText();
            }

            throw new RuntimeException("AI service returned an unexpected response structure: " + responseJson);

        } catch (RuntimeException e) {
            log.error("AI API call failed: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("AI API call failed: {}", e.getMessage());
            throw new RuntimeException("AI API call failed: " + e.getMessage(), e);
        }
    }
}
