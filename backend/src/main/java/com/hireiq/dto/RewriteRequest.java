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
public class RewriteRequest {

    @NotBlank(message = "Resume text cannot be blank")
    private String resumeText;

    @NotBlank(message = "Job description cannot be blank")
    private String jobDescription;

    private String candidateName;
    private String email;
    private String phone;
    private String linkedin;
}
