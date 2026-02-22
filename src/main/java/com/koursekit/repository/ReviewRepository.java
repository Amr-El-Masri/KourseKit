package com.koursekit.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.koursekit.model.Review;
import com.koursekit.model.ReviewStatus;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    // This is the "Gatekeeper" method for your View Reviews page
    List<Review> findBySectionCourseIdAndStatus(Long courseId, ReviewStatus status);
    List<Review> findBySectionIdAndStatus(Long sectionId, ReviewStatus status);
    boolean existsByUserIdAndSectionCourseId(String userId, Long courseId);
}