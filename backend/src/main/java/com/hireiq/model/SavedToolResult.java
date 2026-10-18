package com.hireiq.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "saved_tool_results")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedToolResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    @JsonIgnore
    private Resume resume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(nullable = false, length = 50)
    private String toolType; // RECRUITER_MATCH, DIAGNOSER, POLISH_BULLETS, OUTREACH, INTERVIEW_PREP

    @Column(length = 200)
    private String jobTitle;

    @Column(length = 200)
    private String companyName;

    @Column(columnDefinition = "TEXT")
    private String jobDescription;

    private Integer score;

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String resultData;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
