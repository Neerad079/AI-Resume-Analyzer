package com.hireiq.controller;

import com.hireiq.dto.MatchRequest;
import com.hireiq.dto.MatchResponse;
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

    @PostMapping("/match")
    public ResponseEntity<MatchResponse> analyzeMatch(@Valid @RequestBody MatchRequest request) {
        MatchResponse response = analysisService.analyzeMatch(request);
        return ResponseEntity.ok(response);
    }
}
