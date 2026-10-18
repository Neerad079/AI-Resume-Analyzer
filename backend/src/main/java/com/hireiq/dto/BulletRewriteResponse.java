package com.hireiq.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulletRewriteResponse {

    @JsonAlias({"overallGrade", "grade", "averageGrade"})
    private String overallBulletGrade;

    @JsonAlias({"summary", "overview"})
    private String criticalSummary;

    @JsonAlias({"priorityActions", "actions", "nextSteps"})
    @Builder.Default
    private List<String> topPriorityActions = new ArrayList<>();

    @JsonAlias({"bullets", "bulletAnalysis", "results", "rewrites", "bulletRewrites", "triage_results"})
    @Builder.Default
    private List<BulletAnalysis> triageResults = new ArrayList<>();

    @Builder.Default
    private List<VerbUpgrade> verbUpgradeBank = new ArrayList<>();

    private ImpactSummary impactSummary;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulletAnalysis {
        @JsonAlias({"bullet", "originalBullet", "input"})
        private String original;

        @JsonAlias({"rating", "score"})
        private String grade;          // D / C / B / A / S

        private String gradeLabel;     // Duty Dump / Action Without Impact / etc.

        @JsonAlias({"issue", "reason", "critique", "feedback", "why"})
        private String problem;        // One sentence: why this bullet fails

        @JsonAlias({"rewrite", "suggested", "improved", "xyzRewrite"})
        private String rewritten;      // X-Y-Z formula rewrite

        private String achievementX;   // Formula breakdown: X
        private String metricY;        // Formula breakdown: Y
        private String methodZ;        // Formula breakdown: Z
        private String metricsNeeded;  // Prompt for missing numbers (null if metrics present)

        @JsonProperty("xyzFormula")
        private String xyzFormula;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerbUpgrade {
        private String weak;
        private List<String> alternatives;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImpactSummary {
        private int bulletsTotal;
        private int bulletsUpgraded;
        private int metricsAdded;
        private List<String> powerVerbsIntroduced;
        private String estimatedAtsDensityImprovement; // Low / Moderate / High
    }
}
