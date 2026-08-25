package com.hireiq.controller;

import com.hireiq.dto.OutreachRequest;
import com.hireiq.dto.OutreachResponse;
import com.hireiq.service.OutreachService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/outreach")
@RequiredArgsConstructor
public class OutreachController {

    private final OutreachService outreachService;

    @PostMapping("/generate")
    public ResponseEntity<OutreachResponse> generateOutreach(
            @Valid @RequestBody OutreachRequest request
    ) {
        OutreachResponse response = outreachService.generateOutreach(request);
        return ResponseEntity.ok(response);
    }
}
