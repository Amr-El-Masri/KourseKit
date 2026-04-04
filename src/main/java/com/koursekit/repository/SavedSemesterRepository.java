package com.koursekit.repository;

import com.koursekit.model.SavedSemester;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SavedSemesterRepository extends JpaRepository<SavedSemester, Long> {
    List<SavedSemester> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT s FROM SavedSemester s LEFT JOIN FETCH s.courses WHERE s.user.id = :userId")
    List<SavedSemester> findByUserIdWithCourses(@Param("userId") Long userId);
    Optional<SavedSemester> findByIdAndUserId(Long id, Long userId);
    void deleteByIdAndUserId(Long id, Long userId);
    Optional<SavedSemester> findByUserIdAndIsTemplateTrue(Long userId);
}
