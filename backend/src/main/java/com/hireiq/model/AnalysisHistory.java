package com.hireiq.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "analysis_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String jobTitle;

    @Column(length = 200)
    private String companyName;

    @Column(columnDefinition = "TEXT")
    private String jobDescription;

    @Column(columnDefinition = "TEXT")
    private String resumeText;

    private Integer matchScore;

    @Column(columnDefinition = "TEXT")
    private String gapReport;

    @Column(columnDefinition = "TEXT")
    private String keywordSuggestions;

    @Column(columnDefinition = "TEXT")
    private String atsFlags;

    @Column(columnDefinition = "TEXT")
    private String linkedinDm;

    @Column(columnDefinition = "TEXT")
    private String coldEmail;

    @Column(columnDefinition = "TEXT")
    private String coverLetterBlurb;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
