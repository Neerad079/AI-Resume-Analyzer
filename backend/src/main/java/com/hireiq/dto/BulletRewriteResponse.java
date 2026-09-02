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
public class BulletRewriteResponse {

    private String overallBulletGrade;
    private String criticalSummary;
    private List<String> topPriorityActions;
    private List<BulletAnalysis> triageResults;
    private List<VerbUpgrade> verbUpgradeBank;
    private ImpactSummary impactSummary;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulletAnalysis {
        private String original;
        private String grade;          // D / C / B / A / S
        private String gradeLabel;     // Duty Dump / Action Without Impact / etc.
        private String problem;        // One sentence: why this bullet fails
        private String rewritten;      // X-Y-Z formula rewrite
        private String achievementX;   // Formula breakdown: X
        private String metricY;        // Formula breakdown: Y
        private String methodZ;        // Formula breakdown: Z
        private String metricsNeeded;  // Prompt for missing numbers (null if metrics present)
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
