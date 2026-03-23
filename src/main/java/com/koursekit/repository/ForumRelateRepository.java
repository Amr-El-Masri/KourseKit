package com.koursekit.repository;

import com.koursekit.model.ForumRelate;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ForumRelateRepository extends JpaRepository<ForumRelate, Long> {
    boolean existsByUserIdAndPostId(String userId, Long postId);
    void deleteByUserIdAndPostId(String userId, Long postId);
}