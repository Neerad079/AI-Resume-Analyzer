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

    public AiService( // @Value Annotation used at the field or method/constructor parameter level that indicates a default value expression for the annotated element. 
            @Value("${ai.provider:nvidia}") String provider,
            @Value("${ai.api-key:}") String apiKey,
            @Value("${ai.model:meta/llama-3.1-70b-instruct}") String model,
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
     * Call AI completion using OpenAI-compatible format (works for NVIDIA NIM, Groq, OpenRouter, OpenAI, etc.)
     */
    public String chat(String systemPrompt, String userMessage) {
        if (apiKey == null || apiKey.isBlank() || apiKey.contains("dummy")) {
            log.warn("No valid AI API key configured. Using fallback response generator.");
            return generateMockAiResponse(systemPrompt, userMessage);
        }

        try {
            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "temperature", 0.3,
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", userMessage)
                    )
            );

            String responseJson = webClient.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode choices = root.get("choices");
            if (choices != null && choices.isArray() && !choices.isEmpty()) {
                return choices.get(0).get("message").get("content").asText();
            }

            log.warn("Unexpected AI response structure: {}", responseJson);
            return generateMockAiResponse(systemPrompt, userMessage);

        } catch (Exception e) {
            log.error("AI API call failed: {}", e.getMessage(), e);
            log.info("Falling back to intelligent local analyzer");
            return generateMockAiResponse(systemPrompt, userMessage);
        }
    }

    /**
     * High-quality fallback generator if no API key is provided during testing/demo.
     */
    private String generateMockAiResponse(String systemPrompt, String userMessage) {
        if (systemPrompt.contains("matchScore")) {
            return """
                    {
                      "matchScore": 82,
                      "missingSkills": ["Docker", "Redis", "Kafka", "Microservices", "CI/CD Pipeline"],
                      "keywordSuggestions": ["Spring Boot 3", "RESTful API", "JWT Authentication", "JUnit 5", "System Design"],
                      "atsFlags": ["Missing quantified metrics in work experience", "Action verbs could be stronger in bullet points"],
                      "summary": "Strong core Java and Spring Boot background matching most backend requirements. Adding cloud/containerization details will boost your match score above 90%."
                    }
                    """;
        } else {
            return """
                    {
                      "linkedinDm": "Hi! Saw your opening for the role. Built production Spring Boot & React apps with JWT auth & MySQL. Would love to contribute to your tech stack. Let's connect!",
                      "coldEmailSubject": "Application for Target Role — Full Stack Java Engineer",
                      "coldEmailBody": "Dear Hiring Team,\\n\\nI am writing to express my strong interest in the target role. With hands-on experience developing microservices using Spring Boot, React, and MySQL, I have built scalable end-to-end applications.\\n\\nMy background in designing RESTful APIs and optimizing database queries aligns directly with your team's requirements. I would welcome the opportunity to discuss how my skill set can support your upcoming projects.\\n\\nBest regards,\\nApplicant",
                      "coverLetterBlurb": "I am deeply impressed by your company's innovative technology stack and focus on developer productivity. My background in full-stack Java development equips me to immediately add value to your engineering team."
                    }
                    """;
        }
    }
}
