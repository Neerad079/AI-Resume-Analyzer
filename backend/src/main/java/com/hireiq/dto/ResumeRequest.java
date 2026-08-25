package com.hireiq.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResumeRequest {

    @NotBlank(message = "Title is required (e.g. Java Developer Resume)")
    private String title;

    @NotBlank(message = "Resume content is required")
    private String resumeText;

    private boolean isDefault;
}
