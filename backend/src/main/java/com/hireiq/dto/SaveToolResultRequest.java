package com.hireiq.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveToolResultRequest {

    private Long resumeId;

    private String resumeTitle;

    @NotBlank(message = "Resume text is required")
    private String resumeText;

    @NotBlank(message = "Tool type is required")
    private String toolType;

    private String jobTitle;

    private String companyName;

    private String jobDescription;

    private Integer score;

    /**
     * Complete tool output data (can be JSON String, Map, or DTO).
     */
    private Object resultData;
}
