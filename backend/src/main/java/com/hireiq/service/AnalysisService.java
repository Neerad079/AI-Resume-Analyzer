package com.hireiq.service;

import com.fasterxml.jackson.core.json.JsonReadFeature;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.hireiq.dto.MatchRequest;
import com.hireiq.dto.MatchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalysisService {

    private final AiService aiService;

    private static final String SYSTEM_PROMPT = """
            You are HireIQ, an expert career coach and ATS (Applicant Tracking System) specialist.
            Your job is to analyze a candidate's resume against a job description and provide actionable feedback.
            
            You MUST respond with ONLY valid JSON (no markdown, no explanation outside JSON) in this exact format:
            {
              "matchScore": <integer 0-100>,
              "missingSkills": ["skill1", "skill2", ...],
              "keywordSuggestions": ["keyword1", "keyword2", ...],
              "atsFlags": ["flag1", "flag2", ...],
              "summary": "<2-3 sentence summary of the match>"
            }
            
            Rules:
            - CRITICAL: In JSON string values, use \\n for line breaks instead of literal newlines.
            - matchScore: holistic score considering skill match, experience relevance, and keyword alignment
            - missingSkills: top 5 skills the JD demands that the resume lacks
            - keywordSuggestions: specific terms/phrases from the JD to weave into the resume
            - atsFlags: formatting or content issues that might fail ATS screening (e.g., "No quantified achievements", "Missing action verbs")
            - summary: brief, constructive overview
            """;

    public MatchResponse analyzeMatch(MatchRequest request) {
        String userMessage = String.format("""
                === JOB DESCRIPTION ===
                %s
                
                === CANDIDATE RESUME ===
                %s
                """, request.getJobDescription(), request.getResumeText());

        String aiResponse = aiService.chat(SYSTEM_PROMPT, userMessage);

        try {
            String jsonContent = extractJson(aiResponse);

            ObjectMapper mapper = JsonMapper.builder()
                    .enable(JsonReadFeature.ALLOW_UNESCAPED_CONTROL_CHARS)
                    .enable(JsonReadFeature.ALLOW_BACKSLASH_ESCAPING_ANY_CHARACTER)
                    .enable(JsonReadFeature.ALLOW_SINGLE_QUOTES)
                    .build();

            Map<String, Object> parsed = mapper.readValue(jsonContent, new TypeReference<>() {});

            return MatchResponse.builder()
                    .matchScore(((Number) parsed.getOrDefault("matchScore", 50)).intValue())
                    .missingSkills(toStringList(parsed.get("missingSkills")))
                    .keywordSuggestions(toStringList(parsed.get("keywordSuggestions")))
                    .atsFlags(toStringList(parsed.get("atsFlags")))
                    .summary((String) parsed.getOrDefault("summary", "Analysis completed."))
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse AI match response: {}", aiResponse, e);
            return MatchResponse.builder()
                    .matchScore(0)
                    .missingSkills(List.of("Error parsing AI response"))
                    .keywordSuggestions(List.of())
                    .atsFlags(List.of())
                    .summary("Analysis could not be completed. Please try again.")
                    .build();
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> toStringList(Object obj) {
        if (obj instanceof List<?>) {
            return (List<String>) obj;
        }
        return List.of();
    }

    private String extractJson(String text) {
        if (text == null) return "";
        int firstBrace = text.indexOf('{');
        int lastBrace = text.lastIndexOf('}');
        if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
            return text.substring(firstBrace, lastBrace + 1);
        }
        return text;
    }
}
