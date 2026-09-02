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
public class InterviewPrepResponse {

    private int confidenceToHireScore;       // 0-10
    private String riskClassification;       // Low / Medium / High / Do Not Advance
    private String primaryConcern;           // Single biggest red flag (one line)

    private List<CredibilityThreat> credibilityThreats;
    private List<String> softSpots;
    private List<String> cultureFitConcerns;
    private List<String> fortressStrengths;

    private List<InterviewQuestion> interrogationBrief;
    private List<DefenseFramework> coachingDefense;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CredibilityThreat {
        private String claim;
        private String whyItsThreat;
        private String whatToSay;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InterviewQuestion {
        private String category;            // Achievement Verification / Gap Probe / Depth Drill / etc.
        private String question;
        private String whyAsked;
        private String weakAnswer;
        private String strongAnswer;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DefenseFramework {
        private String threat;
        private String leadWith;
        private String supportWith;
        private String defuseWith;
        private String closeWith;
    }
}
