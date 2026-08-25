package com.hireiq.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OutreachRequest {

    @NotBlank(message = "Company name is required")
    private String companyName;

    @NotBlank(message = "Target role is required")
    private String targetRole;

    @NotBlank(message = "Resume text is required")
    private String resumeText;

    private String jobDescription;
}
