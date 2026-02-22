package com.koursekit.repository;

import com.koursekit.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {
    Optional<Course> findByCourseCode(String courseCode);
    List<Course> findByCourseCodeContainingIgnoreCaseOrTitleContainingIgnoreCase(String code, String title);
}