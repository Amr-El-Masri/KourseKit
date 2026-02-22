package com.koursekit.repository;

import com.koursekit.model.Section;
import com.koursekit.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SectionRepository extends JpaRepository<Section, Long> {
    boolean existsByCrn(String crn);
    List<Section> findByCourseId(Long courseId);
}