package com.hireiq.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DiagnoseRequest {

    @NotBlank(message = "Resume text is required")
    private String resumeText;

    /** Optional — helps the Diagnoser target the right keyword set */
    private String targetRole;
}
