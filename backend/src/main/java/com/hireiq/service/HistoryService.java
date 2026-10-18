package com.hireiq.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hireiq.dto.HistoryItemResponse;
import com.hireiq.dto.ResumeProfileHistoryResponse;
import com.hireiq.dto.SaveToolResultRequest;
import com.hireiq.dto.SavedToolResultResponse;
import com.hireiq.model.AnalysisHistory;
import com.hireiq.model.Resume;
import com.hireiq.model.SavedToolResult;
import com.hireiq.model.User;
import com.hireiq.repository.AnalysisHistoryRepository;
import com.hireiq.repository.ResumeRepository;
import com.hireiq.repository.SavedToolResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class HistoryService {

    private final AnalysisHistoryRepository historyRepository;
    private final ResumeRepository resumeRepository;
    private final SavedToolResultRepository savedToolResultRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ==========================================
    // Multi-Tool Consolidated History by Profile
    // ==========================================

    @Transactional(readOnly = true)
    public List<ResumeProfileHistoryResponse> getUserResumeProfilesHistory(User user) {
        List<Resume> userResumes = resumeRepository.findByUserOrderByCreatedAtDesc(user);
        List<ResumeProfileHistoryResponse> responseList = new ArrayList<>();

        for (Resume resume : userResumes) {
            List<SavedToolResult> results = savedToolResultRepository
                    .findByResumeAndUserOrderByCreatedAtDesc(resume, user);

            List<SavedToolResultResponse> resultResponses = results.stream()
                    .map(this::toSavedResultResponse)
                    .collect(Collectors.toList());

            String snippet = resume.getResumeText();
            if (snippet != null && snippet.length() > 180) {
                snippet = snippet.substring(0, 180) + "...";
            }

            responseList.add(ResumeProfileHistoryResponse.builder()
                    .id(resume.getId())
                    .title(resume.getTitle())
                    .resumeSnippet(snippet)
                    .resumeText(resume.getResumeText())
                    .isDefault(resume.isDefault())
                    .createdAt(resume.getCreatedAt())
                    .updatedAt(resume.getUpdatedAt())
                    .savedResultsCount(resultResponses.size())
                    .savedResults(resultResponses)
                    .build());
        }

        return responseList;
    }

    @Transactional(readOnly = true)
    public ResumeProfileHistoryResponse getResumeProfileHistory(Long resumeId, User user) {
        Resume resume = resumeRepository.findByIdAndUser(resumeId, user)
                .orElseThrow(() -> new RuntimeException("Resume profile not found"));

        List<SavedToolResult> results = savedToolResultRepository
                .findByResumeAndUserOrderByCreatedAtDesc(resume, user);

        List<SavedToolResultResponse> resultResponses = results.stream()
                .map(this::toSavedResultResponse)
                .collect(Collectors.toList());

        String snippet = resume.getResumeText();
        if (snippet != null && snippet.length() > 180) {
            snippet = snippet.substring(0, 180) + "...";
        }

        return ResumeProfileHistoryResponse.builder()
                .id(resume.getId())
                .title(resume.getTitle())
                .resumeSnippet(snippet)
                .resumeText(resume.getResumeText())
                .isDefault(resume.isDefault())
                .createdAt(resume.getCreatedAt())
                .updatedAt(resume.getUpdatedAt())
                .savedResultsCount(resultResponses.size())
                .savedResults(resultResponses)
                .build();
    }

    @Transactional
    public SavedToolResultResponse saveToolResult(User user, SaveToolResultRequest request) {
        // 1. Identify or create the corresponding Resume Profile
        Resume targetResume = null;

        if (request.getResumeId() != null) {
            targetResume = resumeRepository.findByIdAndUser(request.getResumeId(), user)
                    .orElse(null);
        }

        if (targetResume == null && request.getResumeText() != null && !request.getResumeText().isBlank()) {
            final String trimmed = request.getResumeText().trim();
            // Check if user has an existing resume with matching content
            targetResume = resumeRepository.findByUserOrderByCreatedAtDesc(user).stream()
                    .filter(r -> r.getResumeText() != null && r.getResumeText().trim().equals(trimmed))
                    .findFirst()
                    .orElse(null);

            // If not found, create a new resume profile for the user
            if (targetResume == null) {
                String title = (request.getResumeTitle() != null && !request.getResumeTitle().isBlank())
                        ? request.getResumeTitle().trim()
                        : "Resume Profile (" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy")) + ")";

                boolean isFirst = resumeRepository.countByUser(user) == 0;
                targetResume = resumeRepository.save(Resume.builder()
                        .user(user)
                        .title(title)
                        .resumeText(request.getResumeText())
                        .isDefault(isFirst)
                        .build());
            }
        }

        if (targetResume == null) {
            throw new RuntimeException("Could not associate or create a resume profile for this analysis.");
        }

        // 2. Serialize full resultData to JSON
        String jsonResult;
        if (request.getResultData() instanceof String) {
            jsonResult = (String) request.getResultData();
        } else {
            try {
                jsonResult = objectMapper.writeValueAsString(request.getResultData());
            } catch (Exception e) {
                log.error("Failed to serialize resultData: {}", e.getMessage());
                jsonResult = String.valueOf(request.getResultData());
            }
        }

        // 3. Persist tool result
        SavedToolResult saved = savedToolResultRepository.save(SavedToolResult.builder()
                .resume(targetResume)
                .user(user)
                .toolType(request.getToolType() != null ? request.getToolType().toUpperCase().trim() : "ANALYSIS")
                .jobTitle(request.getJobTitle())
                .companyName(request.getCompanyName())
                .jobDescription(request.getJobDescription())
                .score(request.getScore())
                .resultData(jsonResult)
                .build());

        // Touch resume updatedAt (flushed automatically by @Transactional)
        targetResume.setUpdatedAt(LocalDateTime.now());

        return toSavedResultResponse(saved);
    }

    @Transactional
    public void deleteSavedToolResult(Long resultId, User user) {
        SavedToolResult result = savedToolResultRepository.findByIdAndUser(resultId, user)
                .orElseThrow(() -> new RuntimeException("Saved result not found or access denied"));

        savedToolResultRepository.delete(result);
    }

    @Transactional
    public void deleteResumeProfile(Long resumeId, User user) {
        Resume resume = resumeRepository.findByIdAndUser(resumeId, user)
                .orElseThrow(() -> new RuntimeException("Resume profile not found or access denied"));

        boolean wasDefault = resume.isDefault();
        resumeRepository.delete(resume);

        if (wasDefault) {
            List<Resume> remaining = resumeRepository.findByUserOrderByCreatedAtDesc(user);
            if (!remaining.isEmpty()) {
                Resume nextDefault = remaining.get(0);
                nextDefault.setDefault(true);
                resumeRepository.save(nextDefault);
            }
        }
    }

    private SavedToolResultResponse toSavedResultResponse(SavedToolResult r) {
        Object parsedData;
        try {
            parsedData = objectMapper.readTree(r.getResultData());
        } catch (Exception e) {
            parsedData = r.getResultData();
        }

        return SavedToolResultResponse.builder()
                .id(r.getId())
                .resumeId(r.getResume().getId())
                .toolType(r.getToolType())
                .jobTitle(r.getJobTitle())
                .companyName(r.getCompanyName())
                .jobDescription(r.getJobDescription())
                .score(r.getScore())
                .resultData(parsedData)
                .createdAt(r.getCreatedAt())
                .build();
    }

    // ==========================================
    // Legacy History support (AnalysisHistory)
    // ==========================================

    public Page<HistoryItemResponse> getUserHistory(User user, int page, int size) {
        return historyRepository
                .findByUserOrderByCreatedAtDesc(user, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    public AnalysisHistory saveAnalysis(AnalysisHistory analysis) {
        return historyRepository.save(analysis);
    }

    public void deleteAnalysis(Long id, User user) {
        AnalysisHistory analysis = historyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Analysis not found"));

        if (!analysis.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized: cannot delete another user's analysis");
        }

        historyRepository.delete(analysis);
    }

    private HistoryItemResponse toResponse(AnalysisHistory h) {
        return HistoryItemResponse.builder()
                .id(h.getId())
                .jobTitle(h.getJobTitle())
                .companyName(h.getCompanyName())
                .matchScore(h.getMatchScore())
                .gapReport(h.getGapReport())
                .keywordSuggestions(h.getKeywordSuggestions())
                .atsFlags(h.getAtsFlags())
                .linkedinDm(h.getLinkedinDm())
                .coldEmail(h.getColdEmail())
                .coverLetterBlurb(h.getCoverLetterBlurb())
                .createdAt(h.getCreatedAt())
                .build();
    }
}
