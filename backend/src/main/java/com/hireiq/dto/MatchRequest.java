package com.hireiq.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MatchRequest {

    @NotBlank(message = "Job description is required")
    private String jobDescription;

    @NotBlank(message = "Resume text is required")
    private String resumeText;

    private String jobTitle;
    private String companyName;
}
