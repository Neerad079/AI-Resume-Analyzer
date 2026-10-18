package com.hireiq.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeProfileHistoryResponse {

    private Long id;

    private String title;

    private String resumeSnippet;

    private String resumeText;

    @JsonProperty("isDefault")
    private boolean isDefault;

    @JsonProperty("isDefault")
    public boolean isDefault() {
        return isDefault;
    }

    @JsonProperty("isDefault")
    public void setDefault(boolean isDefault) {
        this.isDefault = isDefault;
    }

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private int savedResultsCount;

    @Builder.Default
    private List<SavedToolResultResponse> savedResults = new ArrayList<>();
}
