package com.hireiq.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RewriteResponse {

    private String fullName;
    private String contactInfo;
    private String summary;
    private List<ExperienceItem> experiences;
    private List<String> skills;
    private List<ProjectItem> projects;
    private List<EducationItem> education;
    private List<String> keywordsInfused;
    private int atsScoreBoost;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExperienceItem {
        private String title;
        private String company;
        private String dates;
        private List<String> bullets;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectItem {
        private String name;
        private String techStack;
        private String description;
        private List<String> bullets;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EducationItem {
        private String degree;
        private String institution;
        private String year;
    }
}
