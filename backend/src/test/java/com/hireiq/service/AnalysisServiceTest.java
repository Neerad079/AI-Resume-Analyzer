package com.hireiq.service;

import com.hireiq.dto.BulletRewriteRequest;
import com.hireiq.dto.BulletRewriteResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalysisServiceTest {

    @Mock
    private AiService aiService;

    private AnalysisService analysisService;

    @BeforeEach
    void setUp() {
        analysisService = new AnalysisService(aiService);
    }

    @Test
    void testRewriteBulletsStandardResponse() {
        String json = """
                {
                  "overallBulletGrade": "A",
                  "criticalSummary": "Strong measurable achievements.",
                  "topPriorityActions": ["Action 1", "Action 2"],
                  "triageResults": [
                    {
                      "bulletIndex": 1,
                      "original": "Worked on backend microservices.",
                      "problem": "Lacks metrics and business outcome.",
                      "grade": "C",
                      "rewritten": "Architected 5 backend microservices in Spring Boot, reducing latency by 35%.",
                      "achievementX": "Architected 5 backend microservices",
                      "metricY": "reducing latency by 35%",
                      "methodZ": "using Spring Boot and Redis caching",
                      "xyzFormula": "Accomplished [5 microservices], as measured by [35% latency drop], by doing [Spring Boot]",
                      "atsKeywordsInjected": ["Spring Boot", "Microservices", "Redis"],
                      "strengths": ["Clear metrics"],
                      "weaknesses": ["None"]
                    }
                  ]
                }
                """;

        when(aiService.chat(anyString(), anyString())).thenReturn(json);

        BulletRewriteRequest req = new BulletRewriteRequest();
        req.setResumeText("Worked on backend microservices.");

        BulletRewriteResponse res = analysisService.rewriteBullets(req);

        assertNotNull(res);
        assertEquals("A", res.getOverallBulletGrade());
        assertEquals("Strong measurable achievements.", res.getCriticalSummary());
        assertEquals(1, res.getTriageResults().size());
        assertEquals("C", res.getTriageResults().get(0).getGrade());
        assertEquals("Worked on backend microservices.", res.getTriageResults().get(0).getOriginal());
    }

    @Test
    void testRewriteBulletsWithReasoningModelThinkTags() {
        String aiOutput = """
                <think>
                The user wants us to audit the bullet points.
                Let's analyze: "Managed a team of developers."
                Grade: C
                Rewrite: Led a team of 8 engineers delivering 4 releases on schedule.
                </think>
                ```json
                {
                  "overallBulletGrade": "B",
                  "criticalSummary": "Team leadership lacks scope.",
                  "triageResults": [
                    {
                      "original": "Managed a team of developers.",
                      "grade": "c",
                      "rewritten": "Led cross-functional team of 8 engineers delivering 4 cloud releases on schedule."
                    }
                  ]
                }
                ```
                """;

        when(aiService.chat(anyString(), anyString())).thenReturn(aiOutput);

        BulletRewriteRequest req = new BulletRewriteRequest();
        req.setResumeText("Managed a team of developers.");

        BulletRewriteResponse res = analysisService.rewriteBullets(req);

        assertNotNull(res);
        assertEquals("B", res.getOverallBulletGrade());
        assertEquals(1, res.getTriageResults().size());
        assertEquals("C", res.getTriageResults().get(0).getGrade()); // Normalized to uppercase
        assertEquals("Managed a team of developers.", res.getTriageResults().get(0).getOriginal());
    }

    @Test
    void testRewriteBulletsTopLevelArray() {
        String aiOutput = """
                [
                  {
                    "original": "Responsible for testing application.",
                    "problem": "Passive responsibility statement without metrics.",
                    "grade": "D",
                    "rewritten": "Engineered automated test suite covering 85% of critical workflows, reducing bug leakage by 40%."
                  }
                ]
                """;

        when(aiService.chat(anyString(), anyString())).thenReturn(aiOutput);

        BulletRewriteRequest req = new BulletRewriteRequest();
        req.setResumeText("Responsible for testing application.");

        BulletRewriteResponse res = analysisService.rewriteBullets(req);

        assertNotNull(res);
        assertEquals("D", res.getOverallBulletGrade()); // Fallback computed from bullets
        assertNotNull(res.getCriticalSummary());
        assertFalse(res.getTopPriorityActions().isEmpty());
        assertEquals(1, res.getTriageResults().size());
        assertEquals("D", res.getTriageResults().get(0).getGrade());
    }

    @Test
    void testRewriteBulletsAlternateKeyBullets() {
        String aiOutput = """
                {
                  "bullets": [
                    {
                      "bullet": "Handled customer tickets daily.",
                      "issue": "No quantification or tools named.",
                      "grade": "C",
                      "rewrite": "Resolved 40+ customer issues daily via Zendesk with a 98% CSAT rating."
                    }
                  ]
                }
                """;

        when(aiService.chat(anyString(), anyString())).thenReturn(aiOutput);

        BulletRewriteRequest req = new BulletRewriteRequest();
        req.setResumeText("Handled customer tickets daily.");

        BulletRewriteResponse res = analysisService.rewriteBullets(req);

        assertNotNull(res);
        assertEquals("C", res.getOverallBulletGrade());
        assertEquals(1, res.getTriageResults().size());
        assertEquals("Handled customer tickets daily.", res.getTriageResults().get(0).getOriginal());
        assertEquals("Resolved 40+ customer issues daily via Zendesk with a 98% CSAT rating.", res.getTriageResults().get(0).getRewritten());
        assertEquals("No quantification or tools named.", res.getTriageResults().get(0).getProblem());
    }

    @Test
    void testMeanGradeCalculationWhenOverallBulletGradeMissing() {
        String aiOutput = """
                {
                  "triageResults": [
                    {
                      "original": "Architected distributed cache.",
                      "grade": "S",
                      "rewritten": "Architected distributed Redis cache serving 10M DAU."
                    },
                    {
                      "original": "Wrote documentation.",
                      "grade": "B",
                      "rewritten": "Authored comprehensive API documentation for 15 microservices."
                    }
                  ]
                }
                """;

        when(aiService.chat(anyString(), anyString())).thenReturn(aiOutput);

        BulletRewriteRequest req = new BulletRewriteRequest();
        req.setResumeText("sample text");

        BulletRewriteResponse res = analysisService.rewriteBullets(req);

        assertNotNull(res);
        // S (4.0) + B (2.0) = 6.0 / 2 = 3.0 -> A
        assertEquals("A", res.getOverallBulletGrade());
        assertEquals(2, res.getTriageResults().size());
    }

    @Test
    void testEmptyTriageResultsThrowsException() {
        String aiOutput = """
                {
                  "overallBulletGrade": "B",
                  "criticalSummary": "No bullets found",
                  "triageResults": []
                }
                """;

        when(aiService.chat(anyString(), anyString())).thenReturn(aiOutput);

        BulletRewriteRequest req = new BulletRewriteRequest();
        req.setResumeText("sample text");

        RuntimeException thrown = assertThrows(RuntimeException.class, () -> analysisService.rewriteBullets(req));
        assertTrue(thrown.getMessage().contains("no bullet triage results"));
    }

    @Test
    void testProseWithBracketsDoesNotTriggerArrayExtraction() {
        String aiOutput = """
                Here is the analysis [Version 2.0]:
                {
                  "overallBulletGrade": "B",
                  "triageResults": [
                    {
                      "original": "Built analytics pipeline.",
                      "grade": "B",
                      "rewritten": "Engineered real-time analytics pipeline processing 500k events/sec."
                    }
                  ]
                }
                """;

        when(aiService.chat(anyString(), anyString())).thenReturn(aiOutput);

        BulletRewriteRequest req = new BulletRewriteRequest();
        req.setResumeText("sample text");

        BulletRewriteResponse res = analysisService.rewriteBullets(req);

        assertNotNull(res);
        assertEquals("B", res.getOverallBulletGrade());
        assertEquals(1, res.getTriageResults().size());
    }
}
