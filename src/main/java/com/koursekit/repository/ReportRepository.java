package com.koursekit.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.koursekit.model.Report;

public interface ReportRepository extends JpaRepository<Report, Long> {
    boolean existsByUserIdAndReviewId(String userId, Long reviewId);
    boolean existsByUserIdAndProfessorReviewId(String userId, Long professorReviewId);
    List<Report> findByReviewId(Long reviewId);
    List<Report> findByProfessorReviewId(Long professorReviewId);
    boolean existsByUserIdAndForumPostId(String userId, Long forumPostId);
    boolean existsByUserIdAndForumCommentId(String userId, Long forumCommentId);
    List<Report> findByForumPostId(Long forumPostId);
    List<Report> findByForumCommentId(Long forumCommentId);
}
