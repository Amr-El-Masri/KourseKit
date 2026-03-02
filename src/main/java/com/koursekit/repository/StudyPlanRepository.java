package com.koursekit.repository;

import com.koursekit.model.StudyPlanEntry;
import com.koursekit.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StudyPlanRepository extends JpaRepository<StudyPlanEntry, Long> {
    List<StudyPlanEntry> findByUserId(Long Id);
    void deleteByTask_Id(Long taskId);

    @Query("SELECT COUNT(e) > 0 FROM StudyPlanEntry e WHERE e.user.id = :userId AND e.task.id = :taskId")
    boolean existsByUserIdAndTaskId(@Param("userId") Long userId, @Param("taskId") Long taskId);
}