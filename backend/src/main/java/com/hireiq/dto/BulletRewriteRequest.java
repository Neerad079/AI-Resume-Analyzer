package com.hireiq.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BulletRewriteRequest {

    @NotBlank(message = "Resume text or bullet content is required")
    private String resumeText;

    /** Optional — if provided, rewrites target JD keywords */
    private String jobDescription;

    /** Optional — used for verb bank and context */
    private String candidateRole;
}
