package com.koursekit.repository;

import com.koursekit.model.StudyBlock;
import com.koursekit.model.StudyPlanEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface StudyBlockRepository extends JpaRepository<StudyBlock,Long> {
    List<StudyBlock> findByStudyPlanEntry(StudyPlanEntry entry);

    List<StudyBlock> findByStudyPlanEntry_User_IdAndDayBetween(
            Long userId,
            LocalDate startDate,
            LocalDate endDate
    );

    @Modifying
    @Query("DELETE FROM StudyBlock b WHERE b.studyPlanEntry = :entry AND b.completed = false")
    void deleteByStudyPlanEntryAndCompletedFalse(@Param("entry") StudyPlanEntry entry);
}