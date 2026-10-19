package com.hireiq.service;

import com.hireiq.dto.BulletRewriteRequest;
import com.hireiq.dto.BulletRewriteResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

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
        assertNotNull(res.getVerbUpgradeBank());
        assertTrue(res.getVerbUpgradeBank().isEmpty());
        assertNotNull(res.getImpactSummary());
        assertEquals(1, res.getImpactSummary().getBulletsTotal());
        assertEquals(1, res.getImpactSummary().getBulletsUpgraded());
        assertEquals(1, res.getImpactSummary().getMetricsAdded());
        assertEquals("High", res.getImpactSummary().getEstimatedAtsDensityImprovement());
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
        assertNotNull(res.getVerbUpgradeBank());
        assertTrue(res.getVerbUpgradeBank().isEmpty());
        assertNotNull(res.getImpactSummary());
        assertEquals(1, res.getImpactSummary().getBulletsTotal());
        assertEquals(1, res.getImpactSummary().getBulletsUpgraded());
        assertEquals(1, res.getImpactSummary().getMetricsAdded());
        assertEquals("High", res.getImpactSummary().getEstimatedAtsDensityImprovement());
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

    @Test
    void testTruncatedArrayRepairsAndParsesSuccessfully() {
        // Simulates the exact production error: AI output ended at line 82 inside an unclosed array
        String truncatedOutput = """
                {
                  "overallBulletGrade": "B",
                  "criticalSummary": "Strong backend experience with metrics missing.",
                  "topPriorityActions": ["Add latency benchmarks", "Use Google XYZ structure"],
                  "triageResults": [
                    {
                      "original": "Engineered microservices in Java.",
                      "problem": "Lacks traffic scale and latency numbers.",
                      "grade": "C",
                      "rewritten": "Architected Java microservices serving 10k QPS with 99.9% uptime."
                    },
                    {
                      "original": "Integrated Redis caching.",
                      "problem": "Missing latency reduction percentage.",
                      "grade": "B",
                      "rewritten": "Integrated Redis cluster caching, reducing P99 latency by 45%."
                    }
                """; // Truncated! Note no ']' and no outer '}'

        when(aiService.chat(anyString(), anyString())).thenReturn(truncatedOutput);

        BulletRewriteRequest req = new BulletRewriteRequest();
        req.setResumeText("sample text");

        BulletRewriteResponse res = analysisService.rewriteBullets(req);

        assertNotNull(res);
        assertEquals("B", res.getOverallBulletGrade());
        assertEquals(2, res.getTriageResults().size());
        assertEquals("Engineered microservices in Java.", res.getTriageResults().get(0).getOriginal());
        assertEquals("Integrated Redis caching.", res.getTriageResults().get(1).getOriginal());
        assertNotNull(res.getVerbUpgradeBank());
        assertTrue(res.getVerbUpgradeBank().isEmpty());
        assertNotNull(res.getImpactSummary());
        assertEquals(2, res.getImpactSummary().getBulletsTotal());
        assertEquals(2, res.getImpactSummary().getBulletsUpgraded());
        assertEquals(2, res.getImpactSummary().getMetricsAdded());
        assertEquals("High", res.getImpactSummary().getEstimatedAtsDensityImprovement());
    }

    @Test
    void testRewriteBulletsPreservesExplicitVerbUpgradeBankAndImpactSummary() {
        String aiOutput = """
                {
                  "overallBulletGrade": "A",
                  "criticalSummary": "Metrics verified.",
                  "triageResults": [
                    {
                      "original": "Built internal dashboard.",
                      "grade": "B",
                      "rewritten": "Designed real-time React analytics dashboard used by 120 internal stakeholders."
                    }
                  ],
                  "verbUpgradeBank": [
                    {
                      "weak": "Built",
                      "alternatives": ["Architected", "Engineered", "Designed"]
                    }
                  ],
                  "impactSummary": {
                    "bulletsTotal": 1,
                    "bulletsUpgraded": 1,
                    "metricsAdded": 1,
                    "powerVerbsIntroduced": ["Designed"],
                    "estimatedAtsDensityImprovement": "Moderate"
                  }
                }
                """;

        when(aiService.chat(anyString(), anyString())).thenReturn(aiOutput);

        BulletRewriteRequest req = new BulletRewriteRequest();
        req.setResumeText("Built internal dashboard.");

        BulletRewriteResponse res = analysisService.rewriteBullets(req);

        assertNotNull(res);
        assertNotNull(res.getVerbUpgradeBank());
        assertEquals(1, res.getVerbUpgradeBank().size());
        assertEquals("Built", res.getVerbUpgradeBank().get(0).getWeak());
        assertEquals(List.of("Architected", "Engineered", "Designed"), res.getVerbUpgradeBank().get(0).getAlternatives());
        assertNotNull(res.getImpactSummary());
        assertEquals(1, res.getImpactSummary().getBulletsTotal());
        assertEquals(1, res.getImpactSummary().getBulletsUpgraded());
        assertEquals(1, res.getImpactSummary().getMetricsAdded());
        assertEquals(List.of("Designed"), res.getImpactSummary().getPowerVerbsIntroduced());
        assertEquals("Moderate", res.getImpactSummary().getEstimatedAtsDensityImprovement());
    }

    @Test
    void testRewriteBulletsWithMalformedVerbUpgradeBankAndImpactSummary() {
        String aiOutput = """
                {
                  "overallBulletGrade": "B",
                  "bullets": [
                    {
                      "bullet": "Worked on payment gateway.",
                      "rating": "C",
                      "rewrite": "Engineered PCI-compliant payment gateway processing $2M daily volume."
                    }
                  ],
                  "verbUpgradeBank": [
                    "invalid-string-entry",
                    12345,
                    {
                      "weak": 999,
                      "alternatives": ["led", 42]
                    },
                    {
                      "weak": "worked",
                      "alternatives": ["engineered", "developed"]
                    }
                  ],
                  "impactSummary": {
                    "bulletsTotal": "invalid-string",
                    "bulletsUpgraded": true,
                    "metricsAdded": null,
                    "powerVerbsIntroduced": ["engineered", 123],
                    "estimatedAtsDensityImprovement": 456
                  }
                }
                """;

        when(aiService.chat(anyString(), anyString())).thenReturn(aiOutput);

        BulletRewriteRequest req = new BulletRewriteRequest();
        req.setResumeText("Worked on payment gateway.");

        BulletRewriteResponse res = analysisService.rewriteBullets(req);

        assertNotNull(res);
        // Non-map entries skipped; map with non-string weak has weak default to ""; valid map parsed
        assertNotNull(res.getVerbUpgradeBank());
        assertEquals(2, res.getVerbUpgradeBank().size());
        assertEquals("", res.getVerbUpgradeBank().get(0).getWeak());
        assertEquals(List.of("led"), res.getVerbUpgradeBank().get(0).getAlternatives());
        assertEquals("worked", res.getVerbUpgradeBank().get(1).getWeak());
        assertEquals(List.of("engineered", "developed"), res.getVerbUpgradeBank().get(1).getAlternatives());

        // Malformed numeric/string impactSummary fields fall back to defaults
        assertNotNull(res.getImpactSummary());
        assertEquals(1, res.getImpactSummary().getBulletsTotal());
        assertEquals(1, res.getImpactSummary().getBulletsUpgraded());
        assertEquals(1, res.getImpactSummary().getMetricsAdded());
        assertEquals(List.of("engineered"), res.getImpactSummary().getPowerVerbsIntroduced());
        assertEquals("High", res.getImpactSummary().getEstimatedAtsDensityImprovement());
    }
}


