package com.hireiq.repository;

import com.hireiq.model.Resume;
import com.hireiq.model.SavedToolResult;
import com.hireiq.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedToolResultRepository extends JpaRepository<SavedToolResult, Long> {

    List<SavedToolResult> findByResumeAndUserOrderByCreatedAtDesc(Resume resume, User user);

    List<SavedToolResult> findByUserOrderByCreatedAtDesc(User user);

    Optional<SavedToolResult> findByIdAndUser(Long id, User user);
}
