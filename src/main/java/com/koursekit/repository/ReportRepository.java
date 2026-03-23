package com.koursekit.repository;

import com.koursekit.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    boolean existsByUserIdAndReviewId(String userId, Long reviewId);
    boolean existsByUserIdAndProfessorReviewId(String userId, Long professorReviewId);
    List<Report> findByReviewId(Long reviewId);
    List<Report> findByProfessorReviewId(Long professorReviewId);
}
