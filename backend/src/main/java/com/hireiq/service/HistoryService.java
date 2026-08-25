package com.hireiq.service;

import com.hireiq.dto.HistoryItemResponse;
import com.hireiq.model.AnalysisHistory;
import com.hireiq.model.User;
import com.hireiq.repository.AnalysisHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class HistoryService {

    private final AnalysisHistoryRepository historyRepository;

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
