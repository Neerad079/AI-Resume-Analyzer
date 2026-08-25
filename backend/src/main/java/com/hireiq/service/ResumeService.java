package com.hireiq.service;

import com.hireiq.dto.ResumeRequest;
import com.hireiq.dto.ResumeResponse;
import com.hireiq.model.Resume;
import com.hireiq.model.User;
import com.hireiq.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private final ResumeRepository resumeRepository;

    public List<ResumeResponse> getUserResumes(User user) {
        return resumeRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ResumeResponse createResume(User user, ResumeRequest request) {
        if (request.isDefault()) {
            clearDefaultResume(user);
        }

        Resume resume = Resume.builder()
                .user(user)
                .title(request.getTitle())
                .resumeText(request.getResumeText())
                .isDefault(request.isDefault())
                .build();

        Resume saved = resumeRepository.save(resume);
        return toResponse(saved);
    }

    public ResumeResponse updateResume(Long id, User user, ResumeRequest request) {
        Resume resume = resumeRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Resume not found"));

        if (request.isDefault() && !resume.isDefault()) {
            clearDefaultResume(user);
        }

        resume.setTitle(request.getTitle());
        resume.setResumeText(request.getResumeText());
        resume.setDefault(request.isDefault());

        return toResponse(resumeRepository.save(resume));
    }

    public void deleteResume(Long id, User user) {
        Resume resume = resumeRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Resume not found"));
        resumeRepository.delete(resume);
    }

    private void clearDefaultResume(User user) {
        resumeRepository.findByUserAndIsDefaultTrue(user).ifPresent(r -> {
            r.setDefault(false);
            resumeRepository.save(r);
        });
    }

    private ResumeResponse toResponse(Resume r) {
        return ResumeResponse.builder()
                .id(r.getId())
                .title(r.getTitle())
                .resumeText(r.getResumeText())
                .isDefault(r.isDefault())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
