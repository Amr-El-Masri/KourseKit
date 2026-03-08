package com.koursekit.repository;

import com.koursekit.model.StudyPlanEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface StudyPlanRepository extends JpaRepository<StudyPlanEntry, Long> {

    List<StudyPlanEntry> findByUserIdAndWeekStart(Long userId, LocalDate weekStart);

    // Keep global query for rebalance/markPastDone which need all entries
    List<StudyPlanEntry> findByUserId(Long userId);

    void deleteByTask_Id(Long taskId);

    @Query("SELECT COUNT(e) > 0 FROM StudyPlanEntry e WHERE e.user.id = :userId AND e.task.id = :taskId AND e.weekStart = :weekStart")
    boolean existsByUserIdAndTaskIdAndWeekStart(@Param("userId") Long userId, @Param("taskId") Long taskId, @Param("weekStart") LocalDate weekStart);
}