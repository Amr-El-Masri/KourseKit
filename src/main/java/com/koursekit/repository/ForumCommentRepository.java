package com.koursekit.repository;

import com.koursekit.model.ForumComment;
import com.koursekit.model.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ForumCommentRepository extends JpaRepository<ForumComment, Long> {

    List<ForumComment> findByPostIdAndStatusOrderByCreatedAtAsc(Long postId, ReviewStatus status);
    List<ForumComment> findByPostIdAndStatusInOrderByCreatedAtAsc(Long postId, List<ReviewStatus> statuses);

    List<ForumComment> findByUserId(String userId);

    Page<ForumComment> findByStatusInOrderByCreatedAtDesc(List<ReviewStatus> statuses, Pageable pageable);
    Page<ForumComment> findByStatusOrderByCreatedAtDesc(ReviewStatus status, Pageable pageable);
}