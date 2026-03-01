package com.koursekit.repository;

import com.koursekit.model.ProfessorReview;
import com.koursekit.model.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProfessorReviewRepository extends JpaRepository<ProfessorReview, Long> {

    List<ProfessorReview> findByProfessorNameAndStatus(String professorName, ReviewStatus status);

    boolean existsByUserIdAndProfessorName(String userId, String professorName);
    List<ProfessorReview> findByStatus(ReviewStatus status);
    List<ProfessorReview> findByUserId(String userId);
}