package com.koursekit.repository;

import com.koursekit.model.Section;
import com.koursekit.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SectionRepository extends JpaRepository<Section, Long> {
    boolean existsByCrn(String crn);
    List<Section> findByCourseId(Long courseId);

    @Query("SELECT DISTINCT s.professorName FROM Section s WHERE LOWER(s.professorName) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<String> findDistinctProfessorNamesByQuery(@Param("query") String query);
}