package com.hireiq.controller;

import com.hireiq.dto.*;
import com.hireiq.service.AnalysisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;

    /**
     * THE RECRUITER — JD-to-Resume fit audit with gap analysis and tailoring playbook.
     * POST /api/analysis/match
     */
    @PostMapping("/match")
    public ResponseEntity<MatchResponse> analyzeMatch(@Valid @RequestBody MatchRequest request) {
        MatchResponse response = analysisService.analyzeMatch(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Full resume rewrite (unchanged).
     * POST /api/analysis/rewrite
     */
    @PostMapping("/rewrite")
    public ResponseEntity<RewriteResponse> rewriteResume(@Valid @RequestBody RewriteRequest request) {
        RewriteResponse response = analysisService.rewriteResume(request);
        return ResponseEntity.ok(response);
    }

    /**
     * THE DIAGNOSER — ATS parse simulation + recruiter eye-scan. Resume-only, no JD required.
     * POST /api/analysis/diagnose
     */
    @PostMapping("/diagnose")
    public ResponseEntity<DiagnoseResponse> diagnoseResume(@Valid @RequestBody DiagnoseRequest request) {
        DiagnoseResponse response = analysisService.diagnoseResume(request);
        return ResponseEntity.ok(response);
    }

    /**
     * THE REWRITER — Bullet-level X-Y-Z rewrite with triage grading (D/C/B/A/S).
     * POST /api/analysis/rewrite/bullets
     */
    @PostMapping("/rewrite/bullets")
    public ResponseEntity<BulletRewriteResponse> rewriteBullets(@Valid @RequestBody BulletRewriteRequest request) {
        BulletRewriteResponse response = analysisService.rewriteBullets(request);
        return ResponseEntity.ok(response);
    }

    /**
     * THE HIRING MANAGER — Interview stress-test, interrogation brief, and coaching defense.
     * POST /api/analysis/interview-prep
     */
    @PostMapping("/interview-prep")
    public ResponseEntity<InterviewPrepResponse> prepareForInterview(@Valid @RequestBody InterviewPrepRequest request) {
        InterviewPrepResponse response = analysisService.prepareForInterview(request);
        return ResponseEntity.ok(response);
    }
}
