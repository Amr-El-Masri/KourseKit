package com.koursekit.repository;

import com.koursekit.model.Section;
import com.koursekit.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SectionRepository extends JpaRepository<Section, Long> {
    boolean existsByCrn(String crn);
}