package com.hireiq.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoryItemResponse {

    private Long id;
    private String jobTitle;
    private String companyName;
    private Integer matchScore;
    private String gapReport;
    private String keywordSuggestions;
    private String atsFlags;
    private String linkedinDm;
    private String coldEmail;
    private String coverLetterBlurb;
    private LocalDateTime createdAt;
}
