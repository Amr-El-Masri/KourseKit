package com.koursekit.repository;

import com.koursekit.model.SavedCourse;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedCourseRepository extends JpaRepository<SavedCourse, Long> {
}
