package com.koursekit.repository;

import com.koursekit.model.SavedAssessment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedAssessmentRepository extends JpaRepository<SavedAssessment, Long> {
}
