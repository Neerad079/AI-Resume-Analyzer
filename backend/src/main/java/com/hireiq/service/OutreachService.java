package com.hireiq.service;

import com.fasterxml.jackson.core.json.JsonReadFeature;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.hireiq.dto.OutreachRequest;
import com.hireiq.dto.OutreachResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutreachService {

    private final AiService aiService;

    private static final String SYSTEM_PROMPT = """
            You are HireIQ, an expert at crafting personalized job-application outreach messages.
            You research the company's tech stack and recent work to make messages feel handcrafted.
            
            You MUST respond with ONLY valid JSON (no markdown, no explanation outside JSON) in this exact format:
            {
              "linkedinDm": "<LinkedIn DM, MUST be under 300 characters, personalized, mentioning company stack>",
              "coldEmailSubject": "<compelling email subject line>",
              "coldEmailBody": "<formal cold email body, 3-4 paragraphs, personalized to the role and company>",
              "coverLetterBlurb": "<one paragraph 'why this company' blurb for cover letters>"
            }
            
            Rules:
            - CRITICAL: In JSON string values, use \\n for line breaks instead of literal newlines.
            - linkedinDm: Must be under 300 characters total. Be concise, reference specific tech.
            - coldEmailBody: Professional but warm. Reference candidate's relevant projects/skills.
            - coverLetterBlurb: Show genuine interest in the company's mission/tech.
            - All messages should feel unique and specific, NOT generic templates.
            """;

    public OutreachResponse generateOutreach(OutreachRequest request) {
        String userMessage = String.format("""
                === TARGET COMPANY ===
                %s
                
                === TARGET ROLE ===
                %s
                
                === JOB DESCRIPTION ===
                %s
                
                === CANDIDATE RESUME ===
                %s
                """,
                request.getCompanyName(),
                request.getTargetRole(),
                request.getJobDescription() != null ? request.getJobDescription() : "Not provided",
                request.getResumeText()
        );

        String aiResponse = aiService.chat(SYSTEM_PROMPT, userMessage);

        try {
            String jsonContent = extractJson(aiResponse);

            ObjectMapper mapper = JsonMapper.builder()
                    .enable(JsonReadFeature.ALLOW_UNESCAPED_CONTROL_CHARS)
                    .enable(JsonReadFeature.ALLOW_BACKSLASH_ESCAPING_ANY_CHARACTER)
                    .enable(JsonReadFeature.ALLOW_SINGLE_QUOTES)
                    .build();

            Map<String, String> parsed = mapper.readValue(jsonContent, new TypeReference<>() {});

            return OutreachResponse.builder()
                    .linkedinDm(parsed.getOrDefault("linkedinDm", ""))
                    .coldEmailSubject(parsed.getOrDefault("coldEmailSubject", ""))
                    .coldEmailBody(parsed.getOrDefault("coldEmailBody", ""))
                    .coverLetterBlurb(parsed.getOrDefault("coverLetterBlurb", ""))
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse AI outreach response. Raw response: {}", aiResponse, e);

            // Resilient Fallback Regex Extraction if JSON parser still fails
            String linkedinDm = extractPattern(aiResponse, "\"linkedinDm\":\\s*\"(.*?)\"");
            String subject = extractPattern(aiResponse, "\"coldEmailSubject\":\\s*\"(.*?)\"");
            String body = extractPattern(aiResponse, "\"coldEmailBody\":\\s*\"(.*?)\"");
            String blurb = extractPattern(aiResponse, "\"coverLetterBlurb\":\\s*\"(.*?)\"");

            if (body.isEmpty()) {
                body = aiResponse;
            }

            return OutreachResponse.builder()
                    .linkedinDm(linkedinDm.isEmpty() ? "LinkedIn DM generation completed." : linkedinDm)
                    .coldEmailSubject(subject.isEmpty() ? "Application for " + request.getTargetRole() : subject)
                    .coldEmailBody(body)
                    .coverLetterBlurb(blurb)
                    .build();
        }
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

    private String extractPattern(String text, String regex) {
        try {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(regex, java.util.regex.Pattern.DOTALL);
            java.util.regex.Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                return matcher.group(1).replace("\\n", "\n").trim();
            }
        } catch (Exception ignored) {}
        return "";
    }
}
