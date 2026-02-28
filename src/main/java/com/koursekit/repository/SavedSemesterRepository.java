package com.koursekit.repository;

import com.koursekit.model.SavedSemester;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedSemesterRepository extends JpaRepository<SavedSemester, Long> {
    List<SavedSemester> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<SavedSemester> findByIdAndUserId(Long id, Long userId);
    void deleteByIdAndUserId(Long id, Long userId);
    Optional<SavedSemester> findByUserIdAndIsTemplateTrue(Long userId);
}
