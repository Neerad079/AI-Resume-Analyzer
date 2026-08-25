package com.hireiq.controller;

import com.hireiq.dto.ResumeRequest;
import com.hireiq.dto.ResumeResponse;
import com.hireiq.model.User;
import com.hireiq.service.ResumeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;
    private final com.hireiq.service.FileParsingService fileParsingService;

    @GetMapping
    public ResponseEntity<List<ResumeResponse>> getResumes(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(resumeService.getUserResumes(user));
    }

    @PostMapping("/parse")
    public ResponseEntity<?> parseResumeFile(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            String text = fileParsingService.extractText(file);
            return ResponseEntity.ok(Map.of(
                    "fileName", file.getOriginalFilename() != null ? file.getOriginalFilename() : "Uploaded File",
                    "extractedText", text
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to parse file: " + e.getMessage()));
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadAndSaveResume(
            @AuthenticationPrincipal User user,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "targetRole", required = false) String targetRole,
            @RequestParam(value = "isDefault", required = false, defaultValue = "false") boolean isDefault
    ) {
        try {
            String text = fileParsingService.extractText(file);
            String resumeTitle = (title != null && !title.isBlank()) 
                    ? title 
                    : (file.getOriginalFilename() != null ? file.getOriginalFilename() : "Uploaded Resume");
            
            ResumeRequest request = new ResumeRequest();
            request.setTitle(resumeTitle);
            request.setResumeText(text);
            request.setDefault(isDefault);

            ResumeResponse saved = resumeService.createResume(user, request);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to parse and save resume: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<ResumeResponse> createResume(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ResumeRequest request
    ) {
        return ResponseEntity.ok(resumeService.createResume(user, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResumeResponse> updateResume(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody ResumeRequest request
    ) {
        return ResponseEntity.ok(resumeService.updateResume(id, user, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteResume(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        resumeService.deleteResume(id, user);
        return ResponseEntity.ok(Map.of("message", "Resume deleted successfully"));
    }
}
