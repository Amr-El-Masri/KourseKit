package com.koursekit.repository;

import com.koursekit.model.UserSyllabus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserSyllabusRepository extends JpaRepository<UserSyllabus, Long> {
    List<UserSyllabus> findByUserId(Long userId);
    Optional<UserSyllabus> findByUserIdAndCourseName(Long userId, String courseName);
    void deleteByUserIdAndCourseName(Long userId, String courseName);
    void deleteByUserId(Long userId);
}
