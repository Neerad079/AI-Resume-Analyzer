package com.hireiq.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiagnoseResponse {

    private int atsScore;                        // 0-10
    private int recruiterScore;                  // 0-10
    private String hirabilitySignal;             // Strong / Moderate / Weak / Critical Issues Found

    private List<String> criticalIssues;         // Fix before applying anywhere
    private List<String> moderateIssues;         // Fix this week
    private List<String> minorImprovements;      // Polish round

    private List<KeywordGap> keywordGaps;        // keyword + status
    private List<BulletRewrite> topRewrites;     // 3 highest-impact rewrites
    private List<String> whatIsWorking;          // Genuine strengths
    private List<String> nextStepsChecklist;     // Prioritized action items

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KeywordGap {
        private String keyword;
        private String status; // Present / Weak / Missing
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulletRewrite {
        private String original;
        private String rewritten;
    }
}
