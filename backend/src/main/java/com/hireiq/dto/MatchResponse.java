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
public class MatchResponse {

    // ── Original fields (kept for backwards compat) ──────────────────────────
    private int matchScore;
    private List<String> missingSkills;
    private List<String> keywordSuggestions;
    private List<String> atsFlags;
    private String summary;

    // ── New Recruiter fields ──────────────────────────────────────────────────
    /** 0-10 overall fit score */
    private int fitScore;

    /** Strong Submit | Submit with Tailoring | Reach Role - Apply with Cover Letter | Do Not Apply Yet */
    private String recommendation;

    /** Non-negotiables — must fix before submitting */
    private List<String> mustFix;

    /** Improvements that meaningfully raise the fit score */
    private List<String> shouldFix;

    /** Genuine competitive advantages for this specific role */
    private List<String> strongAssets;

    /** Frank 2-3 sentence recruiter take */
    private String honestTake;

    /** 1-2 things the cover letter must address */
    private List<String> coverLetterPriority;
}
