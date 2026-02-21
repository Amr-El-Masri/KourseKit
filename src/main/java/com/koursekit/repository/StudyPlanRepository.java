package com.koursekit.repository;

import com.koursekit.model.StudyPlanEntry;
import com.koursekit.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudyPlanRepository extends JpaRepository<StudyPlanEntry, Long> {
    List<StudyPlanEntry> findByUserId(Long Id);
    void deleteByTask_Id(Long taskId);

}
