package com.koursekit.repository;

import com.koursekit.model.ForumComment;
import com.koursekit.model.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ForumCommentRepository extends JpaRepository<ForumComment, Long> {

    List<ForumComment> findByPostIdAndStatusOrderByCreatedAtAsc(Long postId, ReviewStatus status);

    List<ForumComment> findByUserId(String userId);
}