package com.hireiq.repository;

import com.hireiq.model.AnalysisHistory;
import com.hireiq.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AnalysisHistoryRepository extends JpaRepository<AnalysisHistory, Long> {

    Page<AnalysisHistory> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    long countByUser(User user);
}
