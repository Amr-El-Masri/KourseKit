package com.koursekit.repository;

import com.koursekit.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {
    boolean existsByUserIdAndReviewId(String userId, Long reviewId);
    boolean existsByUserIdAndProfessorReviewId(String userId, Long professorReviewId);
    boolean existsByUserIdAndForumPostId(String userId, Long forumPostId);
    boolean existsByUserIdAndForumCommentId(String userId, Long forumCommentId);
}
