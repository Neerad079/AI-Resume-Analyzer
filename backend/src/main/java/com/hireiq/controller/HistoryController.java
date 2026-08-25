package com.hireiq.controller;

import com.hireiq.dto.HistoryItemResponse;
import com.hireiq.model.AnalysisHistory;
import com.hireiq.model.User;
import com.hireiq.service.HistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class HistoryController {

    private final HistoryService historyService;

    @GetMapping
    public ResponseEntity<Page<HistoryItemResponse>> getHistory(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<HistoryItemResponse> history = historyService.getUserHistory(user, page, size);
        return ResponseEntity.ok(history);
    }

    @PostMapping
    public ResponseEntity<?> saveAnalysis(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body
    ) {
        AnalysisHistory analysis = AnalysisHistory.builder()
                .user(user)
                .jobTitle((String) body.getOrDefault("jobTitle", "Untitled"))
                .companyName((String) body.getOrDefault("companyName", ""))
                .jobDescription((String) body.getOrDefault("jobDescription", ""))
                .resumeText((String) body.getOrDefault("resumeText", ""))
                .matchScore(body.get("matchScore") != null ? ((Number) body.get("matchScore")).intValue() : null)
                .gapReport((String) body.getOrDefault("gapReport", ""))
                .keywordSuggestions((String) body.getOrDefault("keywordSuggestions", ""))
                .atsFlags((String) body.getOrDefault("atsFlags", ""))
                .linkedinDm((String) body.getOrDefault("linkedinDm", ""))
                .coldEmail((String) body.getOrDefault("coldEmail", ""))
                .coverLetterBlurb((String) body.getOrDefault("coverLetterBlurb", ""))
                .build();

        historyService.saveAnalysis(analysis);
        return ResponseEntity.ok(Map.of("message", "Analysis saved successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAnalysis(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        try {
            historyService.deleteAnalysis(id, user);
            return ResponseEntity.ok(Map.of("message", "Analysis deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
