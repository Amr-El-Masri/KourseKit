package com.koursekit.repository;

import com.koursekit.model.StudyPlanEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface StudyPlanRepository extends JpaRepository<StudyPlanEntry, Long> {

    List<StudyPlanEntry> findByUserIdAndWeekStartAndSemesterName(Long userId, LocalDate weekStart, String semesterName);

    List<StudyPlanEntry> findByUserId(Long userId);

    void deleteByTask_Id(Long taskId);

    boolean existsByUserIdAndSemesterName(Long userId, String semesterName);
    boolean existsByUserId(Long userId);

    @Query("SELECT COUNT(e) > 0 FROM StudyPlanEntry e WHERE e.user.id = :userId AND e.task.id = :taskId AND e.weekStart = :weekStart AND (:semester IS NULL OR e.semesterName = :semester)")
    boolean existsByUserIdAndTaskIdAndWeekStartAndSemester(@Param("userId") Long userId, @Param("taskId") Long taskId, @Param("weekStart") LocalDate weekStart, @Param("semester") String semester);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE StudyPlanEntry e SET e.completedHours = 0 WHERE e.id IN :ids")
    void resetCompletedHoursByIds(@Param("ids") List<Long> ids);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("DELETE FROM StudyPlanEntry e WHERE e.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}