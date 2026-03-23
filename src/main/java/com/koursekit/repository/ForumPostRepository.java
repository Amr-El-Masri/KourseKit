package com.koursekit.repository;

import com.koursekit.model.ForumPost;
import com.koursekit.model.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {

    List<ForumPost> findByStatusOrderByCreatedAtDesc(ReviewStatus status);

    List<ForumPost> findByCategoryAndStatusOrderByCreatedAtDesc(String category, ReviewStatus status);

    List<ForumPost> findByCourseTagAndStatusOrderByCreatedAtDesc(String courseTag, ReviewStatus status);

    List<ForumPost> findByProfessorTagAndStatusOrderByCreatedAtDesc(String professorTag, ReviewStatus status);

    List<ForumPost> findByUserId(String userId);
}