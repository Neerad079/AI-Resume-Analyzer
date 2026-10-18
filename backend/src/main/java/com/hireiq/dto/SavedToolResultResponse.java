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
public class SavedToolResultResponse {

    private Long id;

    private Long resumeId;

    private String toolType;

    private String jobTitle;

    private String companyName;

    private String jobDescription;

    private Integer score;

    private Object resultData;

    private LocalDateTime createdAt;
}
