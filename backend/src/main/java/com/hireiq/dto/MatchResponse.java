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

    private int matchScore;
    private List<String> missingSkills;
    private List<String> keywordSuggestions;
    private List<String> atsFlags;
    private String summary;
}
