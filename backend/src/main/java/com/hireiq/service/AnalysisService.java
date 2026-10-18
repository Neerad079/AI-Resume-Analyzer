package com.hireiq.service;

import com.fasterxml.jackson.core.json.JsonReadFeature;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.hireiq.dto.*;
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

    // ─────────────────────────────────────────────────────────────────────────────
    // PROMPT: THE RECRUITER — JD-to-Resume Fit Audit (powers /api/analysis/match)
    // ─────────────────────────────────────────────────────────────────────────────
    private static final String RECRUITER_PROMPT = """
            CRITICAL REQUIREMENT: OUTPUT ONLY VALID RAW JSON. YOUR RESPONSE MUST START IMMEDIATELY WITH THE OPENING BRACE '{' AND END WITH '}'. DO NOT OUTPUT ANY THINKING, REASONING, PREAMBLE, INTRO, OR MARKDOWN.

            You are THE RECRUITER — a senior talent acquisition manager with 15+ years placing candidates at top-tier companies.
            Your job is to audit a resume against a job description with zero sugarcoating, telling the candidate exactly how their profile measures up and what to do about it.

            You MUST respond with ONLY valid JSON (no markdown, no explanation outside JSON) in this exact format:
            {
              "matchScore": <integer 0-100>,
              "fitScore": <integer 0-10>,
              "recommendation": "<Strong Submit | Submit with Tailoring | Reach Role - Apply with Cover Letter | Do Not Apply Yet>",
              "missingSkills": ["skill1", "skill2"],
              "keywordSuggestions": ["keyword1", "keyword2"],
              "atsFlags": ["flag1", "flag2"],
              "mustFix": ["non-negotiable fix 1", "non-negotiable fix 2"],
              "shouldFix": ["improvement 1", "improvement 2"],
              "strongAssets": ["asset 1", "asset 2"],
              "honestTake": "<2-3 sentence frank recruiter assessment>",
              "coverLetterPriority": ["point 1 cover letter must address", "point 2"],
              "keywordInjectionMap": {"keyword": "where to add on resume (e.g. Skills section, bullet in Role X)", "keyword2": "location"},
              "summary": "<2-3 sentence constructive summary>"
            }

            Rules:
            - CRITICAL: In JSON string values, use \\n for line breaks instead of literal newlines.
            - matchScore: 0-100 holistic score (skill match + experience + keyword alignment)
            - fitScore: 0-10 overall fit
            - missingSkills: top 5 skills the JD demands that the resume lacks
            - keywordSuggestions: specific ATS-weighted terms from the JD to add to the resume
            - atsFlags: formatting or content issues that might fail ATS screening
            - mustFix: non-negotiables the candidate must address before submitting
            - shouldFix: improvements that meaningfully raise the fit score
            - strongAssets: genuine competitive advantages for this role (no false positives)
            - honestTake: frank recruiter assessment — biggest asset + one thing that could sink it
            - coverLetterPriority: 1-2 things the cover letter MUST address
            - keywordInjectionMap: where each missing JD keyword should appear on the resume
            """;

    // ─────────────────────────────────────────────────────────────────────────────
    // PROMPT: THE DIAGNOSER — ATS + Recruiter Resume Diagnostic (powers /api/analysis/diagnose)
    // ─────────────────────────────────────────────────────────────────────────────
    private static final String DIAGNOSER_PROMPT = """
            CRITICAL REQUIREMENT: OUTPUT ONLY VALID RAW JSON. YOUR RESPONSE MUST START IMMEDIATELY WITH THE OPENING BRACE '{' AND END WITH '}'. DO NOT OUTPUT ANY THINKING, REASONING, PREAMBLE, INTRO, OR MARKDOWN.

            You are THE DIAGNOSER — a dual-mode expert: an ATS parser engine AND a senior technical recruiter with 10+ years of screening experience.
            Your job is to give a brutally honest, structured diagnosis of a resume — exactly the way an ATS and a human reviewer would see it.

            You MUST respond with ONLY valid JSON (no markdown, no explanation outside JSON) in this exact format:
            {
              "atsScore": <integer 0-10>,
              "recruiterScore": <integer 0-10>,
              "hirabilitySignal": "<Strong | Moderate | Weak | Critical Issues Found>",
              "criticalIssues": ["issue 1 — what it is → Fix: exact action", "issue 2 — what it is → Fix: exact action"],
              "moderateIssues": ["issue 1 → Fix: exact action", "issue 2 → Fix: exact action"],
              "minorImprovements": ["improvement 1 → Fix: exact action"],
              "keywordGaps": [
                {"keyword": "keyword1", "status": "<Present | Weak | Missing>"},
                {"keyword": "keyword2", "status": "<Present | Weak | Missing>"}
              ],
              "topRewrites": [
                {"original": "<original bullet verbatim>", "rewritten": "<stronger version with action verb + metric + impact>"},
                {"original": "<original bullet verbatim>", "rewritten": "<stronger version>"},
                {"original": "<original bullet verbatim>", "rewritten": "<stronger version>"}
              ],
              "whatIsWorking": ["genuine strength 1", "genuine strength 2"],
              "nextStepsChecklist": ["Step 1 (Critical)", "Step 2 (Critical)", "Step 3 (Moderate)", "Step 4 (Minor)"]
            }

            Rules:
            - CRITICAL: In JSON string values, use \\n for line breaks instead of literal newlines.
            - atsScore / recruiterScore: honest 0-10, not inflated
            - criticalIssues: cause automatic rejection or parse failure — be direct
            - moderateIssues: reduce match rate or leave a poor impression
            - minorImprovements: small refinements
            - keywordGaps: identify the top 10 keywords for the apparent target role; mark each Present/Weak/Missing
            - topRewrites: exactly 3 bullets — pick the weakest, rewrite with strong action verb + quantified result
            - whatIsWorking: genuine strengths only — no false positives
            - nextStepsChecklist: prioritized, immediately actionable
            """;

    // ─────────────────────────────────────────────────────────────────────────────
    // PROMPT: THE REWRITER — Elite Bullet Transformer (powers /api/analysis/rewrite/bullets)
    // ─────────────────────────────────────────────────────────────────────────────
    private static final String REWRITER_PROMPT = """
            CRITICAL REQUIREMENT: OUTPUT ONLY VALID RAW JSON. YOUR RESPONSE MUST START IMMEDIATELY WITH THE OPENING BRACE '{' AND END WITH '}'. DO NOT OUTPUT ANY THINKING, REASONING, PREAMBLE, INTRO, OR MARKDOWN.

            You are THE REWRITER — an elite executive resume writer who transforms weak, passive bullets into high-impact achievement statements using Google's X-Y-Z formula: Accomplished [X], as measured by [Y], by doing [Z].

            You MUST respond with ONLY valid JSON (no markdown, no explanation outside JSON) in this exact format:
            {
              "overallBulletGrade": "<D | C | B | A | S>",
              "criticalSummary": "<2-3 sentence executive assessment of bullet quality and overall impact>",
              "topPriorityActions": ["Action 1 (most critical)", "Action 2", "Action 3"],
              "triageResults": [
                {
                  "original": "<original bullet verbatim>",
                  "grade": "<D | C | B | A | S>",
                  "gradeLabel": "<Duty Dump | Action Without Impact | Result Without Method | Near-Formula | X-Y-Z Compliant>",
                  "problem": "<one sentence: exactly why this bullet fails>",
                  "rewritten": "<new bullet using X-Y-Z formula: Accomplished [X], as measured by [Y], by doing [Z]>",
                  "achievementX": "<what was accomplished>",
                  "metricY": "<the measurable result or [~X%] placeholder>",
                  "methodZ": "<one crisp clause explaining how>",
                  "metricsNeeded": "<null if metrics present, otherwise prompt like: To strengthen this bullet: How many users? What was before/after time?>",
                  "xyzFormula": "Accomplished [<what>], as measured by [<metric>], by doing [<method>]"
                }
              ],
              "verbUpgradeBank": [
                {"weak": "Managed", "alternatives": ["Directed", "Orchestrated", "Scaled", "Led"]},
                {"weak": "Helped", "alternatives": ["Enabled", "Accelerated", "Partnered"]}
              ],
              "impactSummary": {
                "bulletsTotal": <integer>,
                "bulletsUpgraded": <integer>,
                "metricsAdded": <integer>,
                "powerVerbsIntroduced": ["verb1", "verb2"],
                "estimatedAtsDensityImprovement": "<Low | Moderate | High>"
              }
            }

            Rules:
            - CRITICAL: Extract and audit the top 6 to 10 most impactful or weakest bullet points from the resume. If the text has fewer than 6 bullets, audit all of them.
            - CRITICAL: Keep all strings concise and punchy so the complete JSON object finishes cleanly within token limits.
            - In JSON string values, use \\n for line breaks instead of literal newlines.
            - overallBulletGrade: Overall weighted grade across all bullets (S, A, B, C, or D).
            - Grade every bullet before rewriting: D=Duty Dump, C=Action Without Impact, B=Result Without Method, A=Near-Formula, S=Already strong.
            - If grade is S, set rewritten = original and note it's already strong in "problem" field.
            - Never fabricate metrics — use placeholders like [~X%] or [$Xk-$Xm] when numbers unavailable.
            - Lead rewrites with power verbs: Architected, Drove, Spearheaded, Engineered, Reduced, Scaled, Launched.
            - Purge all filler: "responsible for", "assisted", "helped", "worked on", "various", "several".
            - verbUpgradeBank: only include verbs the user actually used that were weak.
            """;

    // ─────────────────────────────────────────────────────────────────────────────
    // PROMPT: THE HIRING MANAGER — Stress Test + Interview Prep (powers /api/analysis/interview-prep)
    // ─────────────────────────────────────────────────────────────────────────────
    private static final String HIRING_MANAGER_PROMPT = """
            CRITICAL REQUIREMENT: OUTPUT ONLY VALID RAW JSON. YOUR RESPONSE MUST START IMMEDIATELY WITH THE OPENING BRACE '{' AND END WITH '}'. DO NOT OUTPUT ANY THINKING, REASONING, PREAMBLE, INTRO, OR MARKDOWN.

            You are THE HIRING MANAGER — a battle-hardened senior hiring manager who has interviewed thousands of candidates and knows exactly how to stress-test a resume.
            Your job is to generate a private pre-interview assessment and a full interrogation brief to prepare the candidate for the worst-case scenario.

            You MUST respond with ONLY valid JSON (no markdown, no explanation outside JSON) in this exact format:
            {
              "confidenceToHireScore": <integer 0-10>,
              "riskClassification": "<Low | Medium | High | Do Not Advance>",
              "primaryConcern": "<one-line summary of the single biggest red flag>",
              "credibilityThreats": [
                {
                  "claim": "<claim on resume that may not survive questioning>",
                  "whyItsThreat": "<why this raises a red flag>",
                  "whatToSay": "<defense framework: lead with X, support with Y, defuse with Z>"
                }
              ],
              "softSpots": ["area that triggers follow-up but is not disqualifying → how to address proactively"],
              "cultureFitConcerns": ["signal → what it implies → how to demonstrate fit"],
              "fortressStrengths": ["part of profile that holds up under any scrutiny"],
              "interrogationBrief": [
                {
                  "category": "<Achievement Verification | Gap Probe | Depth Drill | Failure Probe | Culture Fit | Trap Question>",
                  "question": "<the actual interview question>",
                  "whyAsked": "<recruiter psychology: why this question is asked>",
                  "weakAnswer": "<what a weak answer looks like>",
                  "strongAnswer": "<what an excellent answer framework looks like>"
                }
              ],
              "coachingDefense": [
                {
                  "threat": "<the credibility threat being coached>",
                  "leadWith": "<strongest true fact that validates the claim>",
                  "supportWith": "<specific detail that proves depth>",
                  "defuseWith": "<honest acknowledgment of limitation>",
                  "closeWith": "<forward-looking reframe>"
                }
              ]
            }

            Rules:
            - CRITICAL: Keep responses concise and punchy so the complete JSON object fits within output token limits.
            - confidenceToHireScore: honest assessment, not inflated
            - Generate exactly 3-4 top interrogationBrief questions.
            - Generate exactly 2 top credibilityThreats and matching coachingDefense entries.
            - cultureFitConcerns: decode the JD's culture signals (fast-paced = high-pressure, self-starter = minimal management, etc.)
            - Never accept vague metrics at face value — flag them as credibility threats
            - fortressStrengths: only genuine anchors — if challenged elsewhere, these are what the candidate leans back on
            """;


    // ═════════════════════════════════════════════════════════════════════════════
    // SERVICE METHODS
    // ═════════════════════════════════════════════════════════════════════════════

    /**
     * THE RECRUITER — JD-to-Resume fit audit with gap analysis and tailoring playbook.
     * Powers: POST /api/analysis/match
     */
    public MatchResponse analyzeMatch(MatchRequest request) {
        String userMessage = String.format("""
                === JOB DESCRIPTION ===
                %s

                === CANDIDATE RESUME ===
                %s
                """, request.getJobDescription(), request.getResumeText());

        String aiResponse = aiService.chat(RECRUITER_PROMPT, userMessage);

        try {
            String jsonContent = extractJson(aiResponse);
            ObjectMapper mapper = buildMapper();
            Map<String, Object> parsed = mapper.readValue(jsonContent, new TypeReference<>() {});

            return MatchResponse.builder()
                    .matchScore(((Number) parsed.getOrDefault("matchScore", 50)).intValue())
                    .fitScore(((Number) parsed.getOrDefault("fitScore", 5)).intValue())
                    .recommendation((String) parsed.getOrDefault("recommendation", "Submit with Tailoring"))
                    .missingSkills(toStringList(parsed.get("missingSkills")))
                    .keywordSuggestions(toStringList(parsed.get("keywordSuggestions")))
                    .atsFlags(toStringList(parsed.get("atsFlags")))
                    .mustFix(toStringList(parsed.get("mustFix")))
                    .shouldFix(toStringList(parsed.get("shouldFix")))
                    .strongAssets(toStringList(parsed.get("strongAssets")))
                    .honestTake((String) parsed.getOrDefault("honestTake", ""))
                    .coverLetterPriority(toStringList(parsed.get("coverLetterPriority")))
                    .summary((String) parsed.getOrDefault("summary", "Analysis completed."))
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse Recruiter AI response: {}", aiResponse, e);
            throw new RuntimeException("Failed to parse Recruiter AI response", e);
        }
    }

    /**
     * THE DIAGNOSER — ATS parse simulation + recruiter eye-scan on resume alone.
     * Powers: POST /api/analysis/diagnose
     */
    public DiagnoseResponse diagnoseResume(DiagnoseRequest request) {
        String userMessage = String.format("""
                === CANDIDATE RESUME ===
                %s
                %s
                """,
                request.getResumeText(),
                request.getTargetRole() != null
                        ? "\n=== TARGET ROLE ===\n" + request.getTargetRole()
                        : "");

        String aiResponse = aiService.chat(DIAGNOSER_PROMPT, userMessage);

        try {
            String jsonContent = extractJson(aiResponse);
            ObjectMapper mapper = buildMapper();
            return mapper.readValue(jsonContent, DiagnoseResponse.class);

        } catch (Exception e) {
            log.error("Failed to parse Diagnoser AI response: {}", aiResponse, e);
            throw new RuntimeException("Failed to parse Diagnoser AI response", e);
        }
    }

    /**
     * THE REWRITER — Bullet-level X-Y-Z rewrite with triage grading.
     * Powers: POST /api/analysis/rewrite/bullets
     */
    public BulletRewriteResponse rewriteBullets(BulletRewriteRequest request) {
        String userMessage = String.format("""
                === RESUME / BULLET CONTENT ===
                %s
                %s
                %s
                """,
                request.getResumeText(),
                request.getJobDescription() != null
                        ? "\n=== TARGET JOB DESCRIPTION (for keyword alignment) ===\n" + request.getJobDescription()
                        : "",
                request.getCandidateRole() != null
                        ? "\n=== CANDIDATE ROLE ===\n" + request.getCandidateRole()
                        : "");

        String aiResponse = aiService.chat(REWRITER_PROMPT, userMessage);
        log.debug("Rewriter AI response (first 500 chars): {}", aiResponse == null ? "null" : aiResponse.substring(0, Math.min(500, aiResponse.length())));

        try {
            String jsonContent = extractJson(aiResponse);
            ObjectMapper mapper = buildMapper();

            BulletRewriteResponse response = null;

            // Pass 1: Try direct deserialization
            try {
                response = mapper.readValue(jsonContent, BulletRewriteResponse.class);
            } catch (Exception parseEx) {
                log.warn("Direct BulletRewriteResponse parse failed ({}), trying manual map extraction", parseEx.getMessage());
            }

            // Pass 2: Manual map extraction fallback if needed
            if (response == null || response.getTriageResults() == null || response.getTriageResults().isEmpty()) {
                Map<String, Object> parsed = mapper.readValue(jsonContent, new TypeReference<>() {});
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> rawBullets = (List<Map<String, Object>>) parsed.getOrDefault("triageResults",
                        parsed.getOrDefault("bullets",
                        parsed.getOrDefault("results",
                        parsed.getOrDefault("rewrites",
                        parsed.getOrDefault("bulletAnalysis", List.of())))));

                List<BulletRewriteResponse.BulletAnalysis> bullets = rawBullets.stream().map(b -> {
                    String orig = (String) b.getOrDefault("original", b.getOrDefault("bullet", ""));
                    String gr = (String) b.getOrDefault("grade", b.getOrDefault("rating", "C"));
                    String prob = (String) b.getOrDefault("problem", b.getOrDefault("issue", b.getOrDefault("feedback", "")));
                    String rew = (String) b.getOrDefault("rewritten", b.getOrDefault("rewrite", b.getOrDefault("suggested", "")));
                    String achX = (String) b.getOrDefault("achievementX", "");
                    String metY = (String) b.getOrDefault("metricY", "");
                    String methZ = (String) b.getOrDefault("methodZ", "");
                    String xyz = (String) b.getOrDefault("xyzFormula", null);
                    if (xyz == null && (!achX.isBlank() || !metY.isBlank() || !methZ.isBlank())) {
                        xyz = String.format("Accomplished [%s], as measured by [%s], by doing [%s]", achX, metY, methZ);
                    }
                    return BulletRewriteResponse.BulletAnalysis.builder()
                            .original(orig)
                            .grade(gr != null ? gr.toUpperCase().trim() : "C")
                            .gradeLabel((String) b.getOrDefault("gradeLabel", ""))
                            .problem(prob)
                            .rewritten(rew)
                            .achievementX(achX)
                            .metricY(metY)
                            .methodZ(methZ)
                            .metricsNeeded((String) b.getOrDefault("metricsNeeded", null))
                            .xyzFormula(xyz)
                            .build();
                }).toList();

                @SuppressWarnings("unchecked")
                Map<String, Object> impactRaw = (Map<String, Object>) parsed.getOrDefault("impactSummary", Map.of());
                String overallGrade = (String) parsed.getOrDefault("overallBulletGrade", null);

                response = BulletRewriteResponse.builder()
                        .overallBulletGrade(overallGrade)
                        .criticalSummary((String) parsed.getOrDefault("criticalSummary", null))
                        .topPriorityActions(toStringList(parsed.getOrDefault("topPriorityActions", parsed.get("actions"))))
                        .triageResults(bullets)
                        .verbUpgradeBank(List.of())
                        .impactSummary(BulletRewriteResponse.ImpactSummary.builder()
                                .bulletsTotal(((Number) impactRaw.getOrDefault("bulletsTotal", bullets.size())).intValue())
                                .bulletsUpgraded(((Number) impactRaw.getOrDefault("bulletsUpgraded", bullets.size())).intValue())
                                .metricsAdded(((Number) impactRaw.getOrDefault("metricsAdded", bullets.size())).intValue())
                                .powerVerbsIntroduced(toStringList(impactRaw.get("powerVerbsIntroduced")))
                                .estimatedAtsDensityImprovement((String) impactRaw.getOrDefault("estimatedAtsDensityImprovement", "High"))
                                .build())
                        .build();
            }

            // Post-processing: Guarantee non-null fields, clean grades, and synthesize xyzFormula
            if (response.getTriageResults() == null) {
                response.setTriageResults(new java.util.ArrayList<>());
            } else {
                for (BulletRewriteResponse.BulletAnalysis b : response.getTriageResults()) {
                    if (b.getGrade() != null) {
                        String g = b.getGrade().toUpperCase().trim();
                        if (g.length() > 1) g = g.substring(0, 1);
                        if (!List.of("S", "A", "B", "C", "D").contains(g)) g = "C";
                        b.setGrade(g);
                    } else {
                        b.setGrade("C");
                    }
                    if (b.getXyzFormula() == null && (b.getAchievementX() != null || b.getMetricY() != null || b.getMethodZ() != null)) {
                        b.setXyzFormula(String.format("Accomplished [%s], as measured by [%s], by doing [%s]",
                                b.getAchievementX() != null ? b.getAchievementX() : "...",
                                b.getMetricY() != null ? b.getMetricY() : "...",
                                b.getMethodZ() != null ? b.getMethodZ() : "..."));
                    }
                }
            }

            if (response.getOverallBulletGrade() == null || response.getOverallBulletGrade().isBlank()) {
                if (response.getTriageResults() != null && !response.getTriageResults().isEmpty()) {
                    if (response.getTriageResults().size() == 1) {
                        response.setOverallBulletGrade(response.getTriageResults().get(0).getGrade());
                    } else {
                        double sum = 0.0;
                        for (BulletRewriteResponse.BulletAnalysis b : response.getTriageResults()) {
                            sum += switch (b.getGrade() != null ? b.getGrade() : "C") {
                                case "S" -> 4.0;
                                case "A" -> 3.0;
                                case "B" -> 2.0;
                                case "C" -> 1.0;
                                case "D" -> 0.0;
                                default -> 1.0;
                            };
                        }
                        double mean = sum / response.getTriageResults().size();
                        int rounded = (int) Math.round(mean);
                        String calculatedGrade = switch (rounded) {
                            case 4 -> "S";
                            case 3 -> "A";
                            case 2 -> "B";
                            case 1 -> "C";
                            default -> "D";
                        };
                        response.setOverallBulletGrade(calculatedGrade);
                    }
                } else {
                    response.setOverallBulletGrade("B");
                }
            } else {
                String g = response.getOverallBulletGrade().toUpperCase().trim();
                if (g.length() > 1) g = g.substring(0, 1);
                if (!List.of("S", "A", "B", "C", "D").contains(g)) g = "B";
                response.setOverallBulletGrade(g);
            }

            if (response.getTriageResults() == null || response.getTriageResults().isEmpty()) {
                throw new IllegalStateException("AI response contained no bullet triage results");
            }

            if (response.getCriticalSummary() == null || response.getCriticalSummary().isBlank()) {
                response.setCriticalSummary(String.format("Audited %d resume bullet points using the Google X-Y-Z formula for measurable impact.",
                        response.getTriageResults().size()));
            }

            if (response.getTopPriorityActions() == null || response.getTopPriorityActions().isEmpty()) {
                response.setTopPriorityActions(List.of(
                        "Replace passive duty statements with quantifiable impact metrics",
                        "Adopt Google's Accomplished [X], as measured by [Y], by doing [Z] structure",
                        "Lead every achievement with a decisive action verb"
                ));
            }

            return response;

        } catch (Exception e) {
            log.error("Failed to parse Rewriter AI response: {}", aiResponse, e);
            throw new RuntimeException("Failed to parse AI response: " + e.getMessage(), e);
        }
    }

    /**
     * THE HIRING MANAGER — Interview stress-test and coaching defense.
     * Powers: POST /api/analysis/interview-prep
     */
    public InterviewPrepResponse prepareForInterview(InterviewPrepRequest request) {
        String userMessage = String.format("""
                === CANDIDATE RESUME ===
                %s

                === TARGET JOB DESCRIPTION ===
                %s
                %s
                """,
                request.getResumeText(),
                request.getJobDescription(),
                request.getTargetCompany() != null
                        ? "\n=== TARGET COMPANY ===\n" + request.getTargetCompany()
                        : "");

        String aiResponse = aiService.chat(HIRING_MANAGER_PROMPT, userMessage);
        log.debug("HiringManager AI response (first 500 chars): {}", aiResponse == null ? "null" : aiResponse.substring(0, Math.min(500, aiResponse.length())));

        try {
            String jsonContent = extractJson(aiResponse);
            ObjectMapper mapper = buildMapper();

            // Pass 1: Direct deserialization
            try {
                return mapper.readValue(jsonContent, InterviewPrepResponse.class);
            } catch (Exception parseEx) {
                log.warn("Direct InterviewPrepResponse parse failed ({}), trying manual map extraction", parseEx.getMessage());
            }

            // Pass 2: Manual map extraction — handles snake_case / field mismatches
            Map<String, Object> parsed = mapper.readValue(jsonContent, new TypeReference<>() {});

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> rawQuestions = (List<Map<String, Object>>) parsed.getOrDefault("interrogationBrief", List.of());
            List<InterviewPrepResponse.InterviewQuestion> questions = rawQuestions.stream().map(q ->
                    InterviewPrepResponse.InterviewQuestion.builder()
                            .category((String) q.getOrDefault("category", "General"))
                            .question((String) q.getOrDefault("question", ""))
                            .whyAsked((String) q.getOrDefault("whyAsked", ""))
                            .weakAnswer((String) q.getOrDefault("weakAnswer", ""))
                            .strongAnswer((String) q.getOrDefault("strongAnswer", ""))
                            .build()
            ).toList();

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> rawThreats = (List<Map<String, Object>>) parsed.getOrDefault("credibilityThreats", List.of());
            List<InterviewPrepResponse.CredibilityThreat> threats = rawThreats.stream().map(t ->
                    InterviewPrepResponse.CredibilityThreat.builder()
                            .claim((String) t.getOrDefault("claim", ""))
                            .whyItsThreat((String) t.getOrDefault("whyItsThreat", ""))
                            .whatToSay((String) t.getOrDefault("whatToSay", ""))
                            .build()
            ).toList();

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> rawDefense = (List<Map<String, Object>>) parsed.getOrDefault("coachingDefense", List.of());
            List<InterviewPrepResponse.DefenseFramework> defense = rawDefense.stream().map(d ->
                    InterviewPrepResponse.DefenseFramework.builder()
                            .threat((String) d.getOrDefault("threat", ""))
                            .leadWith((String) d.getOrDefault("leadWith", ""))
                            .supportWith((String) d.getOrDefault("supportWith", ""))
                            .defuseWith((String) d.getOrDefault("defuseWith", ""))
                            .closeWith((String) d.getOrDefault("closeWith", ""))
                            .build()
            ).toList();

            return InterviewPrepResponse.builder()
                    .confidenceToHireScore(((Number) parsed.getOrDefault("confidenceToHireScore", 5)).intValue())
                    .riskClassification((String) parsed.getOrDefault("riskClassification", "Medium"))
                    .primaryConcern((String) parsed.getOrDefault("primaryConcern", ""))
                    .credibilityThreats(threats)
                    .softSpots(toStringList(parsed.get("softSpots")))
                    .cultureFitConcerns(toStringList(parsed.get("cultureFitConcerns")))
                    .fortressStrengths(toStringList(parsed.get("fortressStrengths")))
                    .interrogationBrief(questions)
                    .coachingDefense(defense)
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse Hiring Manager AI response: {}", aiResponse, e);
            throw new RuntimeException("Failed to parse Hiring Manager AI response", e);
        }
    }


    // ═════════════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═════════════════════════════════════════════════════════════════════════════

    private ObjectMapper buildMapper() {
        return JsonMapper.builder()
                .enable(JsonReadFeature.ALLOW_UNESCAPED_CONTROL_CHARS)
                .enable(JsonReadFeature.ALLOW_BACKSLASH_ESCAPING_ANY_CHARACTER)
                .enable(JsonReadFeature.ALLOW_SINGLE_QUOTES)
                .enable(JsonReadFeature.ALLOW_TRAILING_COMMA)
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
                .configure(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES, false)
                .build();
    }

    /**
     * Extracts the first complete JSON object from an AI response string.
     * Handles markdown code fences (```json ... ```) and stray text around the JSON.
     */
    private String extractJson(String text) {
        if (text == null || text.isBlank() || "null".equalsIgnoreCase(text.trim())) return "{}";

        // Strip thinking/reasoning tags (<think>...</think>) from reasoning models
        String cleaned = text.replaceAll("(?s)<think>.*?</think>", "").trim();

        // Strip markdown code fences (```json ... ``` or ``` ... ```)
        cleaned = cleaned.replaceAll("(?s)```(?:json)?\\s*", "").trim();

        // If response is a top-level JSON array [ ... ], wrap into {"triageResults": [...]}
        if (cleaned.startsWith("[")) {
            int lastBracket = cleaned.lastIndexOf(']');
            if (lastBracket > 0) {
                String arrayContent = cleaned.substring(0, lastBracket + 1);
                return "{\"triageResults\":" + arrayContent + "}";
            }
        }

        // Find balanced braces — walk char by char to find outermost { }
        int start = -1;
        int depth = 0;
        for (int i = 0; i < cleaned.length(); i++) {
            char c = cleaned.charAt(i);
            if (c == '{') {
                if (start == -1) start = i;
                depth++;
            } else if (c == '}') {
                if (depth > 0) {
                    depth--;
                    if (depth == 0 && start != -1) {
                        return cleaned.substring(start, i + 1);
                    }
                }
            }
        }

        // Fallback: simple first-last brace slice
        int firstBrace = cleaned.indexOf('{');
        if (firstBrace != -1) {
            int lastBrace  = cleaned.lastIndexOf('}');
            if (lastBrace > firstBrace) {
                return cleaned.substring(firstBrace, lastBrace + 1);
            }
        }

        log.error("No JSON braces found in AI output. Output was:\n{}", text);
        throw new IllegalArgumentException("AI response did not contain JSON object {...}");
    }

    @SuppressWarnings("unchecked")
    private List<String> toStringList(Object obj) {
        if (obj instanceof List<?>) {
            return (List<String>) obj;
        }
        return List.of();
    }
}
